'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/hooks/useWalletCompat';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAddPostToCache } from '@/hooks/usePosts';
import { useInvalidateUserStats } from '@/hooks/useUserStats';
import { useUploadingPosts, UploadingPost } from '@/hooks/useUploadingPosts';
import {
  PhotoIcon,
  RocketLaunchIcon,
  CheckCircleIcon,
  BoltIcon,
  LinkIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

const CONTENT_CATEGORIES = [
  { value: 'movie', label: 'Movie', icon: '🎬' },
  { value: 'album', label: 'Album', icon: '💿' },
  { value: 'songs', label: 'Songs', icon: '🎵' },
  { value: 'youtube_video', label: 'YouTube Video', icon: '▶️' },
  { value: 'live_stream', label: 'Live Stream', icon: '🔴' },
  { value: 'alpha_call', label: 'Alpha Call', icon: '📢' },
  { value: 'course_series', label: 'Course Series', icon: '📚' },
  { value: 'podcast', label: 'Podcast', icon: '🎙️' },
  { value: 'nft_collection', label: 'NFT Collection', icon: '🖼️' },
  { value: 'meme', label: 'Meme', icon: '😂' },
  { value: 'art', label: 'Art', icon: '🎨' },
  { value: 'newsletter', label: 'Newsletter', icon: '📰' },
  { value: 'tutorial', label: 'Tutorial', icon: '🎓' },
] as const;

export default function CreatePage() {
  const router = useRouter();
  const { connected, publicKey } = useWallet();
  const invalidateUserStats = useInvalidateUserStats();
  const addPostToCache = useAddPostToCache();
  const { addUploadingPost, updateUploadingPost, removeUploadingPost } = useUploadingPosts();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Core form state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Token launch toggle + fields
  const [tokenLaunchEnabled, setTokenLaunchEnabled] = useState(false);
  const [ticker, setTicker] = useState('');
  const [contentCategory, setContentCategory] = useState('');
  const [contentLink, setContentLink] = useState('');
  const [utilityDescription, setUtilityDescription] = useState('');

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10MB');
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));

    // Auto-fill ticker from file name when token mode is on
    if (tokenLaunchEnabled && !ticker) {
      const name = file.name.split('.')[0].toUpperCase().slice(0, 6);
      setTicker(name);
    }

    toast.success('Image uploaded!');
  };

  const canSubmit = () => {
    if (!connected || !publicKey || isCreating) return false;
    // Must have either content or media
    if (!content && !imageFile) return false;
    // If token mode, need ticker + category
    if (tokenLaunchEnabled) {
      if (!ticker || ticker.length < 3) return false;
      if (!contentCategory) return false;
      if (!imageFile) return false; // Token posts require media
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!canSubmit()) return;

    setIsCreating(true);

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const optimisticPost: UploadingPost = {
      tempId,
      user_id: 'temp-user',
      type: tokenLaunchEnabled ? 'trading_journey' : 'lifestyle',
      title: title || (tokenLaunchEnabled ? ticker : ''),
      content: content || (tokenLaunchEnabled ? `Launch of $${ticker}` : ''),
      media_urls: [],
      preview_url: imagePreview || undefined,
      token_mint: null,
      token_symbol: tokenLaunchEnabled ? ticker.toUpperCase() : null,
      token_name: tokenLaunchEnabled ? (title || ticker) : null,
      token_display_name: tokenLaunchEnabled ? ticker.toUpperCase() : null,
      token_is_verified: false,
      pool_address: null,
      bonding_curve_address: null,
      token_metadata_uri: null,
      token_signature: null,
      is_token_tradable: false,
      content_category: tokenLaunchEnabled ? contentCategory : null,
      content_link: tokenLaunchEnabled ? contentLink : null,
      token_utility_description: tokenLaunchEnabled ? utilityDescription : null,
      verified: false,
      creator_is_verified: false,
      users: {
        id: 'temp-user',
        username: 'user',
        display_name: 'You',
        avatar_url: null,
        wallet_address: publicKey!.toBase58(),
      },
      uploadProgress: 0,
      uploadStage: 'uploading',
    };

    addUploadingPost(optimisticPost);
    router.push('/');

    try {
      updateUploadingPost(tempId, { uploadProgress: 10, uploadStage: 'uploading' });

      const formData = new FormData();
      formData.append('wallet', publicKey!.toBase58());
      formData.append('content', content || (tokenLaunchEnabled ? `Launch of $${ticker}` : ''));
      if (title) formData.append('title', title);
      if (imageFile) formData.append('media', imageFile);

      if (tokenLaunchEnabled) {
        // Token launch flow — use existing /api/posts/create
        formData.append('ticker', ticker.toUpperCase());
        formData.append('username', 'user');
        if (!formData.get('title')) {
          formData.append('title', ticker);
        }
        if (contentCategory) formData.append('content_category', contentCategory);
        if (contentLink) formData.append('content_link', contentLink);
        if (utilityDescription) formData.append('token_utility_description', utilityDescription);

        updateUploadingPost(tempId, { uploadProgress: 30, uploadStage: 'creating_post' });

        const response = await fetch('/api/posts/create', {
          method: 'POST',
          body: formData,
        });

        updateUploadingPost(tempId, { uploadProgress: 60 });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create token');
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to create token');
        }

        updateUploadingPost(tempId, { uploadProgress: 80, uploadStage: 'creating_token' });
        await new Promise(resolve => setTimeout(resolve, 500));
        updateUploadingPost(tempId, { uploadProgress: 95 });

        const postData = result.data.post;
        const tokenMint = result.data.token.mint;
        const explorerUrl = result.data.tokenExplorerUrl;

        updateUploadingPost(tempId, { uploadProgress: 100, uploadStage: 'complete' });
        addPostToCache(postData);
        await invalidateUserStats(postData.user_id);

        setTimeout(() => removeUploadingPost(tempId), 1000);

        toast.success(
          <div className="flex flex-col gap-2">
            <div className="font-bold font-display uppercase">Token Launched!</div>
            <div className="text-sm">
              <div className="mb-2 font-mono">${ticker}</div>
              <div className="mb-2 font-mono text-xs truncate text-white/60">{tokenMint}</div>
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-neon-lime hover:text-[#E5FF4D] underline"
                onClick={(e) => e.stopPropagation()}
              >
                View on Explorer
              </a>
            </div>
          </div>,
          { duration: 10000 }
        );
      } else {
        // Normal post flow — use /api/posts/create-simple
        updateUploadingPost(tempId, { uploadProgress: 40, uploadStage: 'creating_post' });

        const response = await fetch('/api/posts/create-simple', {
          method: 'POST',
          body: formData,
        });

        updateUploadingPost(tempId, { uploadProgress: 80 });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create post');
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to create post');
        }

        updateUploadingPost(tempId, { uploadProgress: 100, uploadStage: 'complete' });
        addPostToCache(result.data.post);
        await invalidateUserStats(result.data.post.user_id);

        setTimeout(() => removeUploadingPost(tempId), 1000);

        toast.success('Post shared!');
      }

      // Reset form
      setIsCreating(false);
      setImageFile(null);
      setImagePreview('');
      setContent('');
      setTitle('');
      setTicker('');
      setContentCategory('');
      setContentLink('');
      setUtilityDescription('');
      setTokenLaunchEnabled(false);
    } catch (error) {
      console.error('Error creating post:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create post';

      updateUploadingPost(tempId, {
        uploadProgress: 0,
        uploadStage: 'error',
        error: errorMessage,
      });

      toast.error(errorMessage);

      setTimeout(() => {
        removeUploadingPost(tempId);
        setIsCreating(false);
      }, 5000);
    }
  };

  return (
    <AppLayout showWallet={true} showSearch={false}>
      <div className="relative min-h-screen pb-24 md:pb-10">
        <div className="max-w-2xl mx-auto pt-4 sm:pt-6 md:pt-8 px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-black font-display uppercase tracking-wide text-white mb-2">
              <span className="text-white">Share Your </span>
              <span className="bg-gradient-to-r from-[#E0FF62] to-[#00F0FF] bg-clip-text text-transparent">
                Flex
              </span>
            </h1>
            <p className="text-white/50 text-sm">
              Post your moment. Toggle on token launch to make it tradeable.
            </p>
          </div>

          <div className="space-y-5">
            {/* Media Upload */}
            <div className={cn(
              'bg-[#12121A] rounded-xl border p-5 transition-all duration-150',
              imagePreview ? 'border-[#E0FF62]/30' : 'border-white/10'
            )}>
              {imagePreview ? (
                <div className="relative group">
                  <img
                    src={imagePreview}
                    alt="Upload preview"
                    className="w-full h-56 sm:h-64 object-cover rounded-lg border border-white/10"
                  />
                  <button
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview('');
                    }}
                    disabled={isCreating}
                    className={cn(
                      'absolute top-3 right-3 px-3 py-1.5 rounded-lg',
                      'bg-red-500/90 text-white font-bold text-xs uppercase',
                      'opacity-0 group-hover:opacity-100 transition-opacity',
                      'hover:bg-red-400 disabled:opacity-50'
                    )}
                  >
                    Remove
                  </button>
                  <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-[#E0FF62]/30">
                    <CheckCircleIcon className="w-4 h-4 text-[#E0FF62] inline mr-1.5" />
                    <span className="text-[#E0FF62] text-xs font-bold">UPLOADED</span>
                  </div>
                </div>
              ) : (
                <label
                  htmlFor="image-upload"
                  className={cn(
                    'block border-2 border-dashed border-white/15 rounded-xl p-10',
                    'text-center cursor-pointer transition-all duration-150',
                    'hover:border-[#E0FF62]/40 hover:bg-[#E0FF62]/5'
                  )}
                >
                  <PhotoIcon className="w-12 h-12 text-white/25 mx-auto mb-3" />
                  <p className="text-white text-base font-bold mb-1">
                    Upload your image
                  </p>
                  <p className="text-white/35 text-xs">
                    Tap to select or drag and drop
                  </p>
                  <input
                    id="image-upload"
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    disabled={isCreating}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Text Content */}
            <div className={cn(
              'bg-[#12121A] rounded-xl border p-5 transition-all duration-150',
              content ? 'border-[#00F0FF]/20' : 'border-white/10'
            )}>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind..."
                maxLength={500}
                rows={3}
                disabled={isCreating}
                className={cn(
                  'w-full bg-transparent resize-none',
                  'text-white text-base placeholder:text-white/25',
                  'focus:outline-none disabled:opacity-50'
                )}
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-white/20 text-xs">{content.length}/500</span>
                {!title && (
                  <button
                    onClick={() => setTitle(' ')}
                    className="text-white/30 text-xs hover:text-white/50 transition-colors"
                  >
                    + Add title
                  </button>
                )}
              </div>
              {title !== '' && (
                <div className="mt-3 pt-3 border-t border-white/5">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Post title (optional)"
                    maxLength={50}
                    disabled={isCreating}
                    className={cn(
                      'w-full bg-transparent',
                      'text-white text-sm font-medium placeholder:text-white/25',
                      'focus:outline-none disabled:opacity-50'
                    )}
                  />
                </div>
              )}
            </div>

            {/* Token Launch Toggle Section */}
            <div className={cn(
              'rounded-xl border transition-all duration-200',
              tokenLaunchEnabled
                ? 'bg-[#E0FF62]/5 border-[#E0FF62]/30'
                : 'bg-[#12121A] border-white/10'
            )}>
              {/* Toggle Header */}
              <div className="flex items-center justify-between p-5">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-9 h-9 rounded-lg flex items-center justify-center transition-colors',
                    tokenLaunchEnabled ? 'bg-[#E0FF62]/20' : 'bg-white/5'
                  )}>
                    <RocketLaunchIcon className={cn(
                      'w-5 h-5 transition-colors',
                      tokenLaunchEnabled ? 'text-[#E0FF62]' : 'text-white/40'
                    )} />
                  </div>
                  <div>
                    <p className={cn(
                      'font-bold text-sm transition-colors',
                      tokenLaunchEnabled ? 'text-[#E0FF62]' : 'text-white'
                    )}>
                      Token Launch
                    </p>
                    <p className="text-white/35 text-xs">
                      Make this post tradeable
                    </p>
                  </div>
                </div>

                {/* Toggle Switch */}
                <button
                  onClick={() => setTokenLaunchEnabled(!tokenLaunchEnabled)}
                  disabled={isCreating}
                  className={cn(
                    'relative w-12 h-7 rounded-full transition-all duration-200',
                    'focus:outline-none disabled:opacity-50',
                    tokenLaunchEnabled
                      ? 'bg-[#E0FF62]'
                      : 'bg-white/10'
                  )}
                  style={{
                    boxShadow: tokenLaunchEnabled ? '0 0 16px rgba(224, 255, 98, 0.3)' : 'none',
                  }}
                  aria-label="Toggle token launch"
                >
                  <div className={cn(
                    'absolute top-1 w-5 h-5 rounded-full transition-all duration-200',
                    tokenLaunchEnabled
                      ? 'left-6 bg-black'
                      : 'left-1 bg-white/40'
                  )} />
                </button>
              </div>

              {/* Token Fields (revealed when toggle ON) */}
              {tokenLaunchEnabled && (
                <div className="px-5 pb-5 space-y-4 border-t border-[#E0FF62]/10 pt-4">
                  {/* Content Category */}
                  <div>
                    <label className="block text-white/60 text-xs font-medium uppercase tracking-wider mb-2">
                      Content Category
                    </label>
                    <div className="relative">
                      <select
                        value={contentCategory}
                        onChange={(e) => setContentCategory(e.target.value)}
                        disabled={isCreating}
                        className={cn(
                          'w-full px-4 py-3 rounded-lg appearance-none',
                          'bg-black/50 border border-white/10',
                          'text-white text-sm',
                          'focus:outline-none focus:border-[#E0FF62]/40',
                          'disabled:opacity-50',
                          !contentCategory && 'text-white/30'
                        )}
                      >
                        <option value="" disabled>Select category...</option>
                        {CONTENT_CATEGORIES.map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.icon} {cat.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                    </div>
                  </div>

                  {/* Token Ticker */}
                  <div>
                    <label className="block text-white/60 text-xs font-medium uppercase tracking-wider mb-2">
                      Token Ticker
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#E0FF62] text-lg font-bold font-mono">
                        $
                      </span>
                      <input
                        type="text"
                        value={ticker}
                        onChange={(e) =>
                          setTicker(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))
                        }
                        placeholder="WAGMI"
                        maxLength={10}
                        disabled={isCreating}
                        className={cn(
                          'w-full pl-10 pr-4 py-3 rounded-lg',
                          'bg-black/50 border border-white/10',
                          'text-white text-lg font-bold font-mono uppercase',
                          'placeholder:text-white/20',
                          'focus:outline-none focus:border-[#E0FF62]/40',
                          'disabled:opacity-50'
                        )}
                      />
                    </div>
                    <p className="text-white/25 text-xs mt-1.5">3-10 characters</p>
                  </div>

                  {/* Content Link */}
                  <div>
                    <label className="block text-white/60 text-xs font-medium uppercase tracking-wider mb-2">
                      Content Link
                    </label>
                    <div className="relative">
                      <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input
                        type="url"
                        value={contentLink}
                        onChange={(e) => setContentLink(e.target.value)}
                        placeholder="https://youtube.com/watch?v=..."
                        disabled={isCreating}
                        className={cn(
                          'w-full pl-10 pr-4 py-3 rounded-lg',
                          'bg-black/50 border border-white/10',
                          'text-white text-sm',
                          'placeholder:text-white/20',
                          'focus:outline-none focus:border-[#E0FF62]/40',
                          'disabled:opacity-50'
                        )}
                      />
                    </div>
                  </div>

                  {/* Token Utility Description */}
                  <div>
                    <label className="block text-white/60 text-xs font-medium uppercase tracking-wider mb-2">
                      Token Utility
                    </label>
                    <textarea
                      value={utilityDescription}
                      onChange={(e) => setUtilityDescription(e.target.value)}
                      placeholder="Describe what token holders get access to..."
                      maxLength={500}
                      rows={3}
                      disabled={isCreating}
                      className={cn(
                        'w-full px-4 py-3 rounded-lg resize-none',
                        'bg-black/50 border border-white/10',
                        'text-white text-sm',
                        'placeholder:text-white/20',
                        'focus:outline-none focus:border-[#E0FF62]/40',
                        'disabled:opacity-50'
                      )}
                    />
                    <p className="text-white/25 text-xs mt-1.5">{utilityDescription.length}/500</p>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="relative">
              {canSubmit() && (
                <div className={cn(
                  'absolute inset-0 rounded-xl blur-xl opacity-50',
                  tokenLaunchEnabled ? 'bg-[#E0FF62]/30' : 'bg-[#00F0FF]/20'
                )} />
              )}

              <Button
                onClick={handleSubmit}
                disabled={!canSubmit()}
                className={cn(
                  'relative w-full py-7 rounded-xl',
                  'text-lg font-black font-display uppercase tracking-wider',
                  'transition-all duration-150',
                  'disabled:opacity-30 disabled:cursor-not-allowed',
                  canSubmit()
                    ? tokenLaunchEnabled
                      ? 'bg-gradient-to-r from-[#E0FF62] to-[#c8e85a] text-black hover:opacity-90 active:scale-[0.98]'
                      : 'bg-gradient-to-r from-[#00F0FF] to-[#00c8d6] text-black hover:opacity-90 active:scale-[0.98]'
                    : 'bg-white/10 text-white/30 border border-white/10'
                )}
              >
                <span className="flex items-center gap-2.5 justify-center">
                  {tokenLaunchEnabled ? (
                    <>
                      <RocketLaunchIcon className={cn('w-6 h-6', isCreating && 'animate-bounce')} />
                      {isCreating ? 'LAUNCHING...' : 'LAUNCH TOKEN'}
                    </>
                  ) : (
                    <>
                      <BoltIcon className={cn('w-6 h-6', isCreating && 'animate-pulse')} />
                      {isCreating ? 'POSTING...' : 'POST'}
                    </>
                  )}
                </span>
              </Button>
            </div>

            {!connected && (
              <div className="text-center text-white/35 text-sm">
                Connect wallet to start posting
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

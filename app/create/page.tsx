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
  SparklesIcon,
  RocketLaunchIcon,
  CheckCircleIcon,
  FireIcon,
  TrophyIcon,
  UserGroupIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { usePlatformStats } from '@/hooks/usePlatformStats';

export default function CreatePage() {
  const router = useRouter();
  const { connected, publicKey } = useWallet();
  const invalidateUserStats = useInvalidateUserStats();
  const addPostToCache = useAddPostToCache();
  const { addUploadingPost, updateUploadingPost, removeUploadingPost } = useUploadingPosts();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [ticker, setTicker] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [currentTempId, setCurrentTempId] = useState<string | null>(null);

  const { data: platformStats } = usePlatformStats();

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

    if (!ticker) {
      const name = file.name.split('.')[0].toUpperCase().slice(0, 6);
      setTicker(name);
    }

    toast.success('Image uploaded!');
  };

  const handleCreate = async () => {
    if (!connected || !publicKey) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!imageFile) {
      toast.error('Please upload an image');
      return;
    }

    if (!ticker || ticker.length < 3) {
      toast.error('Please enter a ticker (3+ characters)');
      return;
    }

    setIsCreating(true);

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setCurrentTempId(tempId);

    const optimisticPost: UploadingPost = {
      tempId,
      user_id: 'temp-user',
      type: 'earnings_flex',
      title: title || ticker,
      content: description || `Launch of $${ticker}`,
      media_urls: [],
      preview_url: imagePreview,
      token_mint: null,
      token_symbol: ticker.toUpperCase(),
      token_name: title || ticker,
      token_display_name: title || ticker,
      token_is_verified: false,
      pool_address: null,
      bonding_curve_address: null,
      token_metadata_uri: null,
      token_signature: null,
      is_token_tradable: false,
      verified: false,
      creator_is_verified: false,
      users: {
        id: 'temp-user',
        username: 'user',
        display_name: 'You',
        avatar_url: null,
        wallet_address: publicKey.toBase58(),
      },
      uploadProgress: 0,
      uploadStage: 'uploading',
    };

    addUploadingPost(optimisticPost);
    router.push('/');

    try {
      updateUploadingPost(tempId, { uploadProgress: 5, uploadStage: 'uploading' });
      await new Promise(resolve => setTimeout(resolve, 100));
      updateUploadingPost(tempId, { uploadProgress: 15 });
      await new Promise(resolve => setTimeout(resolve, 100));
      updateUploadingPost(tempId, { uploadProgress: 25 });
      await new Promise(resolve => setTimeout(resolve, 100));
      updateUploadingPost(tempId, { uploadProgress: 33 });

      const formData = new FormData();
      formData.append('title', title || ticker);
      formData.append('ticker', ticker.toUpperCase());
      formData.append('content', description || `Launch of $${ticker}`);
      formData.append('wallet', publicKey.toBase58());
      formData.append('username', 'user');
      formData.append('media', imageFile);

      updateUploadingPost(tempId, { uploadProgress: 40, uploadStage: 'creating_post' });

      const response = await fetch('/api/posts/create', {
        method: 'POST',
        body: formData,
      });

      updateUploadingPost(tempId, { uploadProgress: 55 });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create token');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create token');
      }

      updateUploadingPost(tempId, { uploadProgress: 66 });

      updateUploadingPost(tempId, {
        uploadProgress: 75,
        uploadStage: 'creating_token',
      });

      await new Promise(resolve => setTimeout(resolve, 500));
      updateUploadingPost(tempId, { uploadProgress: 85 });
      await new Promise(resolve => setTimeout(resolve, 500));
      updateUploadingPost(tempId, { uploadProgress: 95 });

      const postData = result.data.post;
      const tokenMint = result.data.token.mint;
      const explorerUrl = result.data.tokenExplorerUrl;

      updateUploadingPost(tempId, {
        uploadProgress: 100,
        uploadStage: 'complete',
      });

      // Add post to cache immediately for instant display
      // This makes the post appear instantly in the feed
      addPostToCache(postData);

      // Invalidate user stats to update post count
      await invalidateUserStats(postData.user_id);

      // Note: We no longer call invalidatePosts() here
      // Realtime subscriptions handle post updates automatically
      // The aggressive invalidation was causing posts to disappear due to race conditions

      setTimeout(() => {
        removeUploadingPost(tempId);
      }, 1000);

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
              View on Explorer →
            </a>
          </div>
        </div>,
        { duration: 10000 }
      );

      setIsCreating(false);
      setCurrentTempId(null);
      setImageFile(null);
      setImagePreview('');
      setTicker('');
      setTitle('');
      setDescription('');

    } catch (error) {
      console.error('Error creating token:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create token';

      updateUploadingPost(tempId, {
        uploadProgress: 0,
        uploadStage: 'error',
        error: errorMessage,
      });

      toast.error(errorMessage);

      setTimeout(() => {
        removeUploadingPost(tempId);
        setIsCreating(false);
        setCurrentTempId(null);
      }, 5000);
    }
  };

  return (
    <AppLayout showWallet={true} showSearch={false}>
      {/* Background effects */}
      <div className="fixed inset-0 bg-gradient-mesh pointer-events-none opacity-30" />
      <div className="fixed inset-0 bg-grid-pattern pointer-events-none opacity-20" />

      <div className="relative min-h-screen pb-20 md:pb-10">
        <div className="max-w-7xl mx-auto pt-4 sm:pt-6 md:pt-8 px-4">
          {/* Hero Section - Cyber Brutalist */}
          <div className="text-center mb-10">
            {(platformStats?.postsToday || 0) > 0 && (
              <div className={cn(
                'inline-flex items-center gap-2 px-4 py-2 mb-6',
                'bg-neon-coral/10 border-2 border-neon-coral/30 rounded-full',
                'animate-pulse-slow'
              )}>
                <FireIcon className="w-4 h-4 text-neon-coral" />
                <span className="font-mono text-sm text-neon-coral font-bold uppercase tracking-wider">
                  {platformStats?.postsToday} FLEXING NOW
                </span>
              </div>
            )}

            <h1 className="heading-1 mb-4">
              <span className="text-white">SHARE YOUR</span>
              <span className="block gradient-text-lime-cyan">
                FLEX
              </span>
            </h1>

            <p className="text-white/60 text-lg max-w-xl mx-auto">
              Every post becomes a tradable token. Share your wins and earn.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 lg:gap-12">
            {/* Left: Create Form */}
            <div className="space-y-6">
              {/* Step 1: Upload Image */}
              <div className={cn(
                'bg-[#0D0D0D] rounded-xl border-2 p-6',
                imagePreview ? 'border-neon-lime/30' : 'border-white/10',
                'transition-all duration-150'
              )}>
                <div className="flex items-center gap-3 mb-5">
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    'font-display font-black text-lg',
                    imagePreview
                      ? 'bg-neon-lime text-black'
                      : 'bg-white/10 text-white/60'
                  )}>
                    1
                  </div>
                  <h2 className="text-white text-xl font-bold font-display uppercase tracking-wide">
                    Upload Your Moment
                  </h2>
                </div>

                {imagePreview ? (
                  <div className="relative group">
                    <img
                      src={imagePreview}
                      alt="Token preview"
                      className="w-full h-64 object-cover rounded-lg border-2 border-neon-lime/30"
                    />
                    <button
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview('');
                      }}
                      disabled={isCreating}
                      className={cn(
                        'absolute top-3 right-3 px-4 py-2 rounded-lg',
                        'bg-neon-coral text-white font-bold text-sm uppercase',
                        'opacity-0 group-hover:opacity-100 transition-opacity',
                        'hover:bg-[#FF4D7A] disabled:opacity-50'
                      )}
                    >
                      Change
                    </button>
                    <div className="absolute bottom-3 left-3 bg-black/90 backdrop-blur px-4 py-2 rounded-lg border border-neon-lime/30">
                      <CheckCircleIcon className="w-5 h-5 text-neon-lime inline mr-2" />
                      <span className="text-neon-lime text-sm font-bold">UPLOADED</span>
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor="image-upload"
                    className={cn(
                      'block border-2 border-dashed border-white/20 rounded-xl p-12',
                      'text-center cursor-pointer transition-all duration-150',
                      'hover:border-neon-lime/50 hover:bg-neon-lime/5'
                    )}
                  >
                    <PhotoIcon className="w-16 h-16 text-white/30 mx-auto mb-4" />
                    <p className="text-white text-xl font-bold mb-2 font-display uppercase">
                      Drop your flex here
                    </p>
                    <p className="text-white/40 text-sm">
                      Share your wins, lifestyle, or journey
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

              {/* Step 2: Choose Ticker */}
              <div className={cn(
                'bg-[#0D0D0D] rounded-xl border-2 p-6',
                ticker.length >= 3 ? 'border-neon-cyan/30' : 'border-white/10',
                'transition-all duration-150'
              )}>
                <div className="flex items-center gap-3 mb-5">
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    'font-display font-black text-lg',
                    ticker.length >= 3
                      ? 'bg-neon-cyan text-black'
                      : 'bg-white/10 text-white/60'
                  )}>
                    2
                  </div>
                  <h2 className="text-white text-xl font-bold font-display uppercase tracking-wide">
                    Name Your Token
                  </h2>
                </div>

                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-neon-lime text-3xl font-bold font-mono">
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
                      'w-full pl-14 pr-6 py-5 rounded-xl',
                      'bg-black border-2 border-white/10',
                      'text-white text-3xl font-bold font-mono text-center uppercase',
                      'placeholder:text-white/20',
                      'focus:outline-none focus:border-neon-lime/50',
                      'transition-all duration-150 disabled:opacity-50'
                    )}
                  />
                </div>
                <p className="text-white/40 text-sm mt-3 text-center font-mono">
                  3-10 characters • Others can trade your token
                </p>
              </div>

              {/* Optional: Title & Description */}
              <details className="bg-[#0D0D0D] rounded-xl border-2 border-white/10 p-6 group">
                <summary className="cursor-pointer text-white font-bold text-sm flex items-center gap-2 uppercase tracking-wider">
                  <SparklesIcon className="w-4 h-4 text-neon-purple" />
                  Optional Details
                  <span className="text-white/40 font-normal normal-case ml-2">(skip for quick post)</span>
                </summary>

                <div className="mt-5 space-y-4">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Give your post a title"
                    maxLength={50}
                    disabled={isCreating}
                    className={cn(
                      'w-full px-4 py-3 rounded-lg',
                      'bg-black border-2 border-white/10',
                      'text-white placeholder:text-white/30',
                      'focus:outline-none focus:border-neon-purple/50',
                      'transition-all duration-150 disabled:opacity-50'
                    )}
                  />

                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell your story..."
                    maxLength={200}
                    rows={3}
                    disabled={isCreating}
                    className={cn(
                      'w-full px-4 py-3 rounded-lg resize-none',
                      'bg-black border-2 border-white/10',
                      'text-white placeholder:text-white/30',
                      'focus:outline-none focus:border-neon-purple/50',
                      'transition-all duration-150 disabled:opacity-50'
                    )}
                  />
                </div>
              </details>

              {/* Post Button - Cyber Brutalist */}
              <div className="relative">
                {/* Glow effect */}
                <div className={cn(
                  'absolute inset-0 rounded-xl blur-xl transition-opacity',
                  imageFile && ticker.length >= 3 && connected
                    ? 'bg-neon-lime/30 opacity-100'
                    : 'opacity-0'
                )} />

                <Button
                  onClick={handleCreate}
                  disabled={!imageFile || !ticker || ticker.length < 3 || !connected || isCreating}
                  className={cn(
                    'relative w-full py-8 rounded-xl',
                    'text-xl font-black font-display uppercase tracking-wider',
                    'transition-all duration-150',
                    'disabled:opacity-40 disabled:cursor-not-allowed',
                    imageFile && ticker.length >= 3 && connected
                      ? 'btn-primary hover:scale-[1.02] active:scale-[0.98]'
                      : 'bg-white/10 text-white/40 border-2 border-white/10'
                  )}
                >
                  <span className="flex items-center gap-3 justify-center">
                    <RocketLaunchIcon className={cn('w-7 h-7', isCreating && 'animate-bounce')} />
                    {isCreating ? 'CREATING...' : 'LAUNCH TOKEN'}
                  </span>
                </Button>
              </div>

              {!connected && (
                <div className="text-center text-white/40 text-sm font-mono">
                  CONNECT WALLET TO START EARNING
                </div>
              )}
            </div>

            {/* Right: Live Preview + Social Proof */}
            <div className="space-y-6 lg:sticky lg:top-24 lg:h-fit">
              {/* Live Preview */}
              <div className="bg-[#0D0D0D] rounded-xl border-2 border-white/10 p-6">
                <h3 className="text-white font-bold text-lg mb-5 flex items-center gap-2 font-display uppercase tracking-wide">
                  <BoltIcon className="w-5 h-5 text-neon-cyan" />
                  Live Preview
                </h3>

                <div className="bg-black rounded-lg p-4 border-2 border-white/10">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Token"
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                  ) : (
                    <div className="w-full h-48 bg-white/5 rounded-lg mb-4 flex items-center justify-center border-2 border-dashed border-white/10">
                      <PhotoIcon className="w-12 h-12 text-white/20" />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <p className={cn(
                        'text-xl font-bold font-mono',
                        ticker ? 'text-neon-lime' : 'text-white/30'
                      )}>
                        ${ticker || 'TICKER'}
                      </p>
                      <p className="text-white/40 text-sm">
                        {title || 'Your token name'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-neon-cyan font-bold font-mono">$0.01</p>
                      <p className="text-xs text-white/40">Starting price</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Proof */}
              <div className="bg-[#0D0D0D] rounded-xl border-2 border-white/10 p-6">
                <h3 className="text-white font-bold text-lg mb-5 flex items-center gap-2 font-display uppercase tracking-wide">
                  <TrophyIcon className="w-5 h-5 text-warning" />
                  Platform Stats
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-white/40 text-sm">Active creators</span>
                    <span className="text-neon-lime font-bold font-mono">{platformStats?.activeTraders || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/40 text-sm">Total creators</span>
                    <span className="text-neon-cyan font-bold font-mono">{platformStats?.totalCreators || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/40 text-sm">Posts today</span>
                    <span className="text-white font-bold font-mono">{platformStats?.postsToday || 0}</span>
                  </div>
                </div>

                <div className="mt-5 pt-5 border-t border-white/10">
                  <p className="text-xs text-white/40 text-center font-mono uppercase tracking-wider">
                    Join {platformStats?.totalCreators || 0}+ creators earning
                  </p>
                </div>
              </div>

              {/* Tips Card */}
              <div className={cn(
                'rounded-xl p-6',
                'bg-neon-purple/5 border-2 border-neon-purple/20'
              )}>
                <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2 font-display uppercase tracking-wide">
                  <UserGroupIcon className="w-4 h-4 text-neon-purple" />
                  Pro Tips
                </h3>
                <ul className="space-y-2 text-xs text-white/50">
                  <li className="flex items-start gap-2">
                    <span className="text-neon-lime">+</span>
                    Post your biggest wins & lifestyle
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-neon-lime">+</span>
                    Catchy names get more attention
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-neon-lime">+</span>
                    Share on Twitter after posting
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-neon-lime">+</span>
                    Engage with your token holders
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

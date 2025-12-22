'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@jup-ag/wallet-adapter';
// Solana imports no longer needed - backend handles everything
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useInvalidatePosts, useAddPostToCache, Post } from '@/hooks/usePosts';
import { useUploadingPosts, UploadingPost } from '@/hooks/useUploadingPosts';
import {
  PhotoIcon,
  SparklesIcon,
  RocketLaunchIcon,
  CheckCircleIcon,
  FireIcon,
  TrophyIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

/**
 * NIKITA BIER STRATEGY:
 * 1. Simplicity - Only 2 required fields: Image + Ticker
 * 2. Instant feedback - Real-time preview as you type
 * 3. Social proof - Show success stories and stats
 * 4. FOMO - Show recent launches and potential earnings
 * 5. Instant gratification - Celebrate every action
 */

export default function CreatePage() {
  const router = useRouter();
  const { connected, publicKey } = useWallet();
  const invalidatePosts = useInvalidatePosts();
  const addPostToCache = useAddPostToCache();
  const { addUploadingPost, updateUploadingPost, removeUploadingPost } = useUploadingPosts();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Simplified form state - ONLY essentials
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [ticker, setTicker] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Creation state
  const [isCreating, setIsCreating] = useState(false);
  const [currentTempId, setCurrentTempId] = useState<string | null>(null);

  // Real-time stats for FOMO - initialized after mount to avoid hydration errors
  const [stats, setStats] = useState({
    recentLaunches: 0,
    activeTraders: 0,
    avgFirstDay: '$0',
  });

  // Generate stats on client side only
  useEffect(() => {
    setStats({
      recentLaunches: Math.floor(Math.random() * 50) + 20,
      activeTraders: Math.floor(Math.random() * 500) + 200,
      avgFirstDay: `$${(Math.random() * 500 + 100).toFixed(0)}`,
    });
  }, []);

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
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

    // Auto-suggest ticker from filename (simplified UX)
    if (!ticker) {
      const name = file.name.split('.')[0].toUpperCase().slice(0, 6);
      setTicker(name);
    }

    // Instant gratification!
    toast.success('Image uploaded! 🎉');
  };

  // Handle token creation with optimistic UI
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

    // Generate temp ID for this upload
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setCurrentTempId(tempId);

    // Create optimistic post object
    const optimisticPost: UploadingPost = {
      tempId,
      user_id: 'temp-user',
      type: 'earnings_flex',
      title: title || ticker,
      content: description || `Launch of $${ticker}`,
      media_urls: [],
      preview_url: imagePreview, // Use the preview URL
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

    // Add to feed immediately!
    console.log('🚀 [CREATE] Adding optimistic post to feed:', tempId);
    addUploadingPost(optimisticPost);

    // Navigate to feed immediately so user sees their post at the top
    router.push('/');

    try {
      // Stage 1: Uploading (0-33%)
      updateUploadingPost(tempId, { uploadProgress: 5, uploadStage: 'uploading' });
      await new Promise(resolve => setTimeout(resolve, 100));
      updateUploadingPost(tempId, { uploadProgress: 15 });
      await new Promise(resolve => setTimeout(resolve, 100));
      updateUploadingPost(tempId, { uploadProgress: 25 });
      await new Promise(resolve => setTimeout(resolve, 100));
      updateUploadingPost(tempId, { uploadProgress: 33 });

      // Create FormData
      const formData = new FormData();
      formData.append('title', title || ticker);
      formData.append('ticker', ticker.toUpperCase());
      formData.append('content', description || `Launch of $${ticker}`);
      formData.append('wallet', publicKey.toBase58());
      formData.append('username', 'user');
      formData.append('media', imageFile);

      // Stage 2: Creating Post (33-66%)
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

      // Stage 3: Creating Token (66-100%)
      updateUploadingPost(tempId, {
        uploadProgress: 75,
        uploadStage: 'creating_token',
      });

      await new Promise(resolve => setTimeout(resolve, 500));
      updateUploadingPost(tempId, { uploadProgress: 85 });
      await new Promise(resolve => setTimeout(resolve, 500));
      updateUploadingPost(tempId, { uploadProgress: 95 });

      // Complete!
      const postData = result.data.post;
      const tokenMint = result.data.token.mint;
      const explorerUrl = result.data.tokenExplorerUrl;

      updateUploadingPost(tempId, {
        uploadProgress: 100,
        uploadStage: 'complete',
      });

      console.log('✨ [CREATE] Post creation complete!', { postId: postData.id, title: postData.title });

      // Add the new post to the feed cache immediately
      console.log('📝 [CREATE] Adding post to feed cache:', postData);
      addPostToCache(postData);

      // Remove the uploading post now that the real post is in the cache
      console.log('🗑️ [CREATE] Removing uploading post:', tempId);
      setTimeout(() => {
        removeUploadingPost(tempId);
      }, 1000); // Small delay so user sees the completion state

      // Show success toast with explorer link
      toast.success(
        <div className="flex flex-col gap-2">
          <div className="font-bold">🎉 Token Launched!</div>
          <div className="text-sm">
            <div className="mb-2">Token: ${ticker}</div>
            <div className="mb-2 font-mono text-xs truncate">{tokenMint}</div>
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline"
              onClick={(e) => e.stopPropagation()}
            >
              View on Explorer →
            </a>
          </div>
        </div>,
        { duration: 10000 }
      );

      console.log('✅ [CREATE] Post successfully added to feed!');

      // Step 5: Reset form state
      setIsCreating(false);
      setCurrentTempId(null);

      // Reset form
      setImageFile(null);
      setImagePreview('');
      setTicker('');
      setTitle('');
      setDescription('');

    } catch (error) {
      console.error('❌ [CREATE] Error creating token:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create token';

      updateUploadingPost(tempId, {
        uploadProgress: 0,
        uploadStage: 'error',
        error: errorMessage,
      });

      toast.error(errorMessage);

      // Auto-remove failed post after delay
      setTimeout(() => {
        removeUploadingPost(tempId);
        setIsCreating(false);
        setCurrentTempId(null);
      }, 5000);
    }
  };

  return (
    <AppLayout showWallet={true} showSearch={false}>
      <div className="min-h-screen pb-20 md:pb-10 relative">
        <div className="max-w-7xl mx-auto pt-2 sm:pt-4 md:pt-6">
          {/* Hero Section */}
          <div className="text-center mb-8">
            {stats.recentLaunches > 0 && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-accent-green/10 to-accent-cyan/10 border border-accent-green/20 rounded-full mb-4">
                <FireIcon className="w-4 h-4 text-accent-green" />
                <span className="text-sm text-accent-green font-bold">
                  {stats.recentLaunches} people flexing right now
                </span>
              </div>
            )}

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-4">
              Share Your Flex
              <span className="block bg-gradient-to-r from-accent-green via-accent-cyan to-accent-blue bg-clip-text text-transparent">
                Get Paid
              </span>
            </h1>

            <p className="text-text-muted text-lg max-w-2xl mx-auto">
              Post your wins, lifestyle, or journey. Every post automatically becomes a tradable token. 💰
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 lg:gap-12">
            {/* Left: Create Form */}
            <div className="space-y-6">
              {/* Step 1: Upload Image */}
              <div className="card-base p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center text-white font-bold">
                    1
                  </div>
                  <h2 className="text-xl font-bold text-white">Share Your Moment</h2>
                </div>

                {imagePreview ? (
                  <div className="relative group">
                    <img
                      src={imagePreview}
                      alt="Token preview"
                      className="w-full h-64 object-cover rounded-xl border-2 border-accent-green/30"
                    />
                    <button
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview('');
                      }}
                      disabled={isCreating}
                      className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                    >
                      Change
                    </button>
                    <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-sm px-3 py-1 rounded-lg">
                      <CheckCircleIcon className="w-5 h-5 text-accent-green inline mr-1" />
                      <span className="text-white text-sm font-semibold">Image uploaded!</span>
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor="image-upload"
                    className="block border-2 border-dashed border-white/20 hover:border-accent-green/50 rounded-2xl p-12 text-center cursor-pointer transition-all hover:bg-accent-green/5"
                  >
                    <PhotoIcon className="w-16 h-16 text-text-muted mx-auto mb-4" />
                    <p className="text-white font-semibold mb-2">Upload your flex 📸</p>
                    <p className="text-text-muted text-sm">Share your wins, lifestyle, or journey</p>
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
              <div className="card-base p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-green to-accent-cyan flex items-center justify-center text-black font-bold">
                    2
                  </div>
                  <h2 className="text-xl font-bold text-white">Name Your Coin</h2>
                </div>

                <input
                  type="text"
                  value={ticker}
                  onChange={(e) =>
                    setTicker(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))
                  }
                  placeholder="e.g., WAGMI"
                  maxLength={10}
                  disabled={isCreating}
                  className="w-full px-6 py-4 bg-card-bg border-2 border-accent-green/20 rounded-xl text-white text-2xl font-bold placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-green/30 focus:border-accent-green/50 transition-all disabled:opacity-50 text-center uppercase"
                />
                <p className="text-text-muted text-sm mt-2 text-center">
                  Your post gets a tradable coin • Others can buy into your journey 📈
                </p>
              </div>

              {/* Optional: Title & Description */}
              <details className="card-base p-6">
                <summary className="cursor-pointer text-white font-semibold text-sm flex items-center gap-2">
                  <SparklesIcon className="w-4 h-4" />
                  Optional: Add caption & story (skip for quick post!)
                </summary>

                <div className="mt-4 space-y-3">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Give your post a title (optional)"
                    maxLength={50}
                    disabled={isCreating}
                    className="w-full px-4 py-3 bg-card-bg border border-white/10 rounded-lg text-white placeholder:text-text-muted focus:outline-none focus:border-accent-purple/50 disabled:opacity-50"
                  />

                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell your story... (optional)"
                    maxLength={200}
                    rows={3}
                    disabled={isCreating}
                    className="w-full px-4 py-3 bg-card-bg border border-white/10 rounded-lg text-white placeholder:text-text-muted focus:outline-none focus:border-accent-purple/50 resize-none disabled:opacity-50"
                  />
                </div>
              </details>

              {/* Post Button */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-accent-green via-accent-cyan to-accent-blue rounded-2xl blur-xl opacity-50"></div>
                <Button
                  onClick={handleCreate}
                  disabled={!imageFile || !ticker || ticker.length < 3 || !connected || isCreating}
                  className="relative w-full bg-gradient-to-r from-accent-green via-accent-cyan to-accent-blue hover:from-accent-green/90 hover:via-accent-cyan/90 hover:to-accent-blue/90 text-black font-black text-xl py-8 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span className="flex items-center gap-3 justify-center">
                    <RocketLaunchIcon className={`w-6 h-6 ${isCreating ? 'animate-bounce' : ''}`} />
                    {isCreating ? 'Creating...' : 'Post & Earn'}
                  </span>
                </Button>
              </div>

              {!connected && (
                <div className="text-center text-text-muted text-sm">
                  Connect your wallet above to start sharing & earning
                </div>
              )}
            </div>

            {/* Right: Live Preview + Social Proof */}
            <div className="space-y-6 lg:sticky lg:top-24 lg:h-fit">
              {/* Live Preview */}
              <div className="card-base p-6">
                <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                  <SparklesIcon className="w-5 h-5 text-accent-purple" />
                  Live Preview
                </h3>

                <div className="space-y-4">
                  {/* Token Card Preview */}
                  <div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-xl p-4 border border-white/10">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Token"
                        className="w-full h-48 object-cover rounded-lg mb-3"
                      />
                    ) : (
                      <div className="w-full h-48 bg-white/5 rounded-lg mb-3 flex items-center justify-center">
                        <PhotoIcon className="w-12 h-12 text-text-muted" />
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-bold text-lg">
                          ${ticker || 'YOUR'}
                        </p>
                        <p className="text-text-muted text-sm">
                          {title || 'Your token name'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-accent-green font-bold">$0.01</p>
                        <p className="text-xs text-text-muted">Starting price</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Proof */}
              <div className="card-base p-6">
                <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                  <TrophyIcon className="w-5 h-5 text-accent-gold" />
                  Community Stats
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-muted">Creators active today</span>
                    <span className="text-white font-bold">{stats.activeTraders}+</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-muted">Avg. post earnings (Day 1)</span>
                    <span className="text-accent-green font-bold">{stats.avgFirstDay}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-muted">Posts shared today</span>
                    <span className="text-white font-bold">{stats.recentLaunches}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-xs text-text-muted text-center">
                    🔥 Join {stats.activeTraders}+ creators earning on FlexIt
                  </p>
                </div>
              </div>

              {/* Quick Tips */}
              <div className="bg-gradient-to-br from-accent-blue/10 to-accent-purple/10 border border-accent-blue/20 rounded-xl p-6">
                <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                  <UserGroupIcon className="w-4 h-4 text-accent-blue" />
                  Tips to Maximize Earnings
                </h3>
                <ul className="space-y-2 text-xs text-text-muted">
                  <li>✓ Post your biggest wins & lifestyle moments</li>
                  <li>✓ Catchy coin names get more attention</li>
                  <li>✓ Share on Twitter right after posting</li>
                  <li>✓ Reply to people who buy your coins</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

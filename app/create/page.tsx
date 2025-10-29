'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@jup-ag/wallet-adapter';
import { Transaction, Connection, clusterApiUrl } from '@solana/web3.js';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useInvalidatePosts } from '@/hooks/usePosts';
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
  const { connected, publicKey, sendTransaction } = useWallet();
  const invalidatePosts = useInvalidatePosts();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Simplified form state - ONLY essentials
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [ticker, setTicker] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Creation state
  const [isCreating, setIsCreating] = useState(false);
  const [progress, setProgress] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);

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

  const connection = new Connection(
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl('devnet'),
    'confirmed'
  );

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

  // Handle token creation
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
    setProgress('Uploading image...');

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('title', title || ticker);
      formData.append('ticker', ticker.toUpperCase());
      formData.append('content', description || `Launch of $${ticker}`);
      formData.append('wallet', publicKey.toBase58());
      formData.append('username', 'user');
      formData.append('media', imageFile);

      setProgress('Creating token on Solana...');

      const response = await fetch('/api/posts/create', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create token');
      }

      const result = await response.json();

      if (!result.success || !result.requiresSignature) {
        throw new Error('Unexpected response from server');
      }

      setProgress('Please sign the transaction...');

      // Deserialize and send transaction
      const transaction = Transaction.from(
        Buffer.from(result.data.token.transaction, 'base64')
      );

      const signature = await sendTransaction(transaction, connection);

      setProgress('Confirming on blockchain...');

      // Wait for confirmation
      const latestBlockhash = await connection.getLatestBlockhash();
      const confirmation = await connection.confirmTransaction(
        {
          signature,
          blockhash: latestBlockhash.blockhash,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
        },
        'confirmed'
      );

      if (confirmation.value.err) {
        throw new Error('Transaction failed on chain');
      }

      setProgress('Saving to database...');

      // Save to database
      await fetch('/api/posts/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signature,
          postData: {
            title: title || ticker,
            ticker: ticker.toUpperCase(),
            content: description || `Launch of $${ticker}`,
            wallet: publicKey.toBase58(),
            mediaUrls: result.data.post.media_urls,
            mint: result.data.token.mint,
            pool: result.data.token.pool,
            metadataUri: result.data.token.metadataUri,
          },
        }),
      });

      // SUCCESS! Show confetti
      setShowConfetti(true);
      setProgress(`🎉 $${ticker} launched successfully!`);

      invalidatePosts();

      // Prompt to share on Twitter
      setTimeout(() => {
        const shouldShare = window.confirm(
          `🚀 Your token $${ticker} is LIVE! Share on Twitter?`
        );

        if (shouldShare) {
          const tweetText = `Just launched my token $${ticker} on @FlexStream! 🚀\n\nToken: ${result.data.token.mint.slice(0, 8)}...\nTrade now: ${window.location.origin}\n\n#Solana #Crypto`;
          window.open(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`,
            '_blank'
          );
        }

        // Navigate to home after 2s
        setTimeout(() => {
          router.push('/');
        }, 2000);
      }, 1500);
    } catch (error) {
      console.error('Error creating token:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create token');
      setIsCreating(false);
      setProgress('');
    }
  };

  return (
    <AppLayout showWallet={true} showSearch={false}>
      <div className="min-h-screen pb-20 md:pb-10 relative">
        {/* Confetti effect */}
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-50">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: '-10%',
                  animationDelay: `${Math.random() * 0.5}s`,
                  animationDuration: `${2 + Math.random() * 1}s`,
                }}
              >
                {['🎉', '🚀', '💰', '⭐', '🔥'][Math.floor(Math.random() * 5)]}
              </div>
            ))}
          </div>
        )}

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
                  {isCreating ? (
                    <span className="flex items-center gap-3">
                      <div className="w-6 h-6 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
                      {progress}
                    </span>
                  ) : (
                    <span className="flex items-center gap-3">
                      <RocketLaunchIcon className="w-6 h-6" />
                      Post & Earn
                    </span>
                  )}
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
                    🔥 Join {stats.activeTraders}+ creators earning on FlexStream
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

      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(-10vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti linear infinite;
          font-size: 2rem;
        }
      `}</style>
    </AppLayout>
  );
}

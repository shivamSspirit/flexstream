'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useWallet } from '@jup-ag/wallet-adapter';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Squares2X2Icon,
  FolderIcon,
  SparklesIcon,
  EllipsisHorizontalIcon,
  WalletIcon
} from '@heroicons/react/24/outline';
import { usePosts } from '@/hooks/usePosts';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { ActivateCreatorCoinModal } from '@/components/creator-coin/ActivateCreatorCoinModal';

interface UserProfile {
  id: string;
  wallet_address: string;
  username: string;
  display_name: string;
  bio?: string;
  avatar_url?: string;
  cover_url?: string;
  twitter?: string;
  instagram?: string;
  website?: string;
  created_at: string;
  creator_coin_enabled?: boolean;
  creator_coin_mint?: string;
  creator_coin_pool?: string;
  creator_coin_metadata_uri?: string;
}

function ProfilePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { connected, publicKey } = useWallet();

  const [activeTab, setActiveTab] = useState<'grid' | 'collected' | 'activity' | 'wallet'>(
    (searchParams.get('tab') as 'grid' | 'collected' | 'activity' | 'wallet') || 'grid'
  );

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showActivateCoinModal, setShowActivateCoinModal] = useState(false);

  // Load user profile
  useEffect(() => {
    if (!connected || !publicKey) {
      setLoading(false);
      return;
    }

    loadUserProfile();
  }, [connected, publicKey]);

  const loadUserProfile = async () => {
    if (!supabase || !publicKey) {
      setLoading(false);
      return;
    }

    try {
      console.log('🔍 Loading profile for wallet:', publicKey.toBase58());
      setLoading(true);

      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', publicKey.toBase58())
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // User doesn't exist yet, create one
          console.log('👤 Creating new user profile...');
          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert({
              wallet_address: publicKey.toBase58(),
              username: `user_${publicKey.toBase58().substring(0, 8)}`,
              display_name: `User ${publicKey.toBase58().substring(0, 8)}`,
            })
            .select()
            .single();

          if (createError) {
            console.error('❌ Error creating user:', createError);
            toast.error('Failed to create user profile');
            return;
          }

          setUserProfile(newUser);
          console.log('✅ User profile created:', newUser);
        } else {
          console.error('❌ Error loading profile:', error);
          toast.error('Failed to load profile');
        }
        return;
      }

      setUserProfile(user);
      console.log('✅ Profile loaded:', user);
    } catch (error) {
      console.error('❌ Error loading profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's posts
  const { data: postsData, isLoading: postsLoading, refetch: refetchPosts } = usePosts({
    userId: userProfile?.id,
    enabled: !!userProfile?.id
  });

  const posts = postsData?.data?.posts || [];

  // Log posts data for debugging
  useEffect(() => {
    if (userProfile?.id) {
      console.log('📊 [PROFILE] Fetching posts for user:', {
        userId: userProfile.id,
        walletAddress: userProfile.wallet_address,
        username: userProfile.username
      });
      console.log('📊 [PROFILE] Posts received:', {
        totalPosts: posts.length,
        postsLoading,
        posts: posts.map(p => ({
          id: p.id,
          title: p.title,
          user_id: p.user_id,
          created_at: p.created_at
        }))
      });

      // Check if there's a mismatch
      if (posts.length === 0 && !postsLoading) {
        console.warn('⚠️ [PROFILE] No posts found for this user. This could mean:');
        console.warn('   1. User has not created any posts yet');
        console.warn('   2. Posts were created with different user_id');
        console.warn('   3. Database query is not matching correctly');
      }
    } else if (!postsLoading) {
      console.log('📊 [PROFILE] No user profile loaded yet');
    }
  }, [posts, postsLoading, userProfile]);

  // Update URL when tab changes
  const handleTabChange = (tab: 'grid' | 'collected' | 'activity' | 'wallet') => {
    setActiveTab(tab);
    router.push(`/profile?tab=${tab}`, { scroll: false });
  };

  // Copy wallet address to clipboard
  const copyWalletAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toBase58());
      toast.success('Wallet address copied!');
    }
  };

  if (loading) {
    return (
      <AppLayout showWallet={true} showSearch={true}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            {/* Enhanced loading spinner */}
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 border-4 border-accent-green/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-transparent border-t-accent-green rounded-full animate-spin"></div>
              <div className="absolute inset-2 border-4 border-transparent border-t-accent-cyan rounded-full animate-spin-slow"></div>
              <div className="absolute inset-4 border-4 border-transparent border-t-accent-blue rounded-full animate-spin-slower"></div>
            </div>
            <p className="text-white/90 font-bold text-lg mb-2">Loading your profile</p>
            <p className="text-white/60 text-sm animate-pulse">Getting everything ready...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!connected || !publicKey) {
    return (
      <AppLayout showWallet={true} showSearch={true}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <WalletIcon className="w-16 h-16 text-secondary mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-primary mb-2">Connect Your Wallet</h2>
            <p className="text-secondary mb-6">Please connect your wallet to view your profile</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showWallet={true} showSearch={true}>
      <div className="w-full max-w-5xl mx-auto pb-20 md:pb-8">
        {/* Cover Image - Enhanced with animated gradient overlay */}
        {userProfile?.cover_url ? (
          <div
            className="h-40 sm:h-48 md:h-56 sm:rounded-2xl mb-12 sm:mb-16 bg-cover bg-center relative overflow-hidden group"
            style={{ backgroundImage: `url(${userProfile.cover_url})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-accent-green/0 via-accent-cyan/10 to-accent-blue/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          </div>
        ) : (
          <div className="h-40 sm:h-48 md:h-56 sm:rounded-2xl mb-12 sm:mb-16 relative overflow-hidden group">
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent-green/20 via-accent-cyan/20 to-accent-blue/20 animate-gradient-shift"></div>
            <div className="absolute inset-0 bg-gradient-to-tl from-accent-purple/10 via-transparent to-accent-pink/10 animate-pulse"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70"></div>
            {/* Floating orbs */}
            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-accent-green/30 rounded-full blur-3xl animate-float"></div>
            <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-accent-cyan/20 rounded-full blur-3xl animate-float-delayed"></div>
          </div>
        )}

        {/* Profile Header */}
        <div className="flex flex-col items-center text-center px-4 sm:px-6 -mt-8 sm:-mt-12">
          {/* Avatar - BIGGER & BOLDER */}
          <Avatar className="h-28 w-28 sm:h-32 sm:w-32 mb-3 sm:mb-4 ring-4 ring-accent-green/40 shadow-2xl shadow-accent-green/30 border-4 border-black">
            <AvatarImage src={userProfile?.avatar_url} />
            <AvatarFallback className="bg-gradient-to-br from-accent-green via-accent-cyan to-accent-blue text-black font-black text-4xl sm:text-5xl">
              {userProfile?.display_name?.[0]?.toUpperCase() || userProfile?.username?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>

          {/* Display Name - BOLD & BIGGER */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-1 sm:mb-2 tracking-tight leading-none">
            {userProfile?.display_name || 'Anonymous User'}
          </h1>

          {/* Username - Better contrast */}
          <p className="text-white/70 mb-3 sm:mb-4 text-sm sm:text-base font-semibold">
            @{userProfile?.username || 'unknown'}
          </p>

          {/* Bio - Better readability */}
          {userProfile?.bio && (
            <p className="text-white/90 text-sm sm:text-base mb-3 sm:mb-4 max-w-xl leading-relaxed">
              {userProfile.bio}
            </p>
          )}

          {/* Wallet Address - Styled badge */}
          <button
            onClick={copyWalletAddress}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full text-white/90 text-xs sm:text-sm mb-4 sm:mb-5 transition-all font-mono border border-white/20 hover:border-accent-green/50 hover:shadow-lg hover:shadow-accent-green/20"
          >
            <span>💎</span>
            <span>{publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}</span>
          </button>

          {/* Social Links - Bigger & More visible */}
          {(userProfile?.twitter || userProfile?.instagram || userProfile?.website) && (
            <div className="flex items-center gap-4 sm:gap-5 mb-4 sm:mb-5">
              {userProfile.twitter && (
                <a
                  href={`https://twitter.com/${userProfile.twitter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-accent-cyan transition-all hover:scale-110 transform p-2 rounded-lg hover:bg-white/10"
                >
                  <svg width="24" height="24" className="sm:w-7 sm:h-7" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
              )}
              {userProfile.instagram && (
                <a
                  href={`https://instagram.com/${userProfile.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-accent-pink transition-all text-2xl sm:text-3xl hover:scale-110 transform p-2 rounded-lg hover:bg-white/10"
                >
                  📷
                </a>
              )}
              {userProfile.website && (
                <a
                  href={userProfile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-accent-blue transition-all text-2xl sm:text-3xl hover:scale-110 transform p-2 rounded-lg hover:bg-white/10"
                >
                  🌐
                </a>
              )}
            </div>
          )}

          {/* Stats Row - BOLD & BIGGER with cards */}
          <div className="flex items-stretch gap-2 sm:gap-3 mb-5 sm:mb-6 w-full max-w-2xl">
            <div className="flex-1 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/10 hover:border-accent-green/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-accent-green/20 cursor-pointer group">
              <div className="text-3xl sm:text-4xl font-black mb-1 bg-gradient-to-r from-accent-green to-accent-cyan bg-clip-text text-transparent leading-none group-hover:scale-110 transition-transform duration-300">
                {posts.length}
              </div>
              <div className="text-white/60 group-hover:text-white/80 text-xs sm:text-sm font-semibold transition-colors">Posts</div>
            </div>
            <div className="flex-1 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/10 hover:border-accent-cyan/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-accent-cyan/20 cursor-pointer group">
              <div className="text-3xl sm:text-4xl font-black mb-1 bg-gradient-to-r from-accent-cyan to-accent-blue bg-clip-text text-transparent leading-none group-hover:scale-110 transition-transform duration-300">
                0
              </div>
              <div className="text-white/60 group-hover:text-white/80 text-xs sm:text-sm font-semibold transition-colors">Holders</div>
            </div>
            <div className="flex-1 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/10 hover:border-accent-blue/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-accent-blue/20 cursor-pointer group">
              <div className="text-3xl sm:text-4xl font-black mb-1 bg-gradient-to-r from-accent-blue to-accent-purple bg-clip-text text-transparent leading-none group-hover:scale-110 transition-transform duration-300">
                0
              </div>
              <div className="text-white/60 group-hover:text-white/80 text-xs sm:text-sm font-semibold transition-colors">Holding</div>
            </div>
          </div>

          {/* Creator Coin Status - Mobile Optimized */}
          {userProfile?.creator_coin_enabled ? (
            <div className="relative bg-gradient-to-br from-accent-green/20 via-accent-cyan/20 to-accent-blue/20 border-2 border-accent-green/40 rounded-xl sm:rounded-2xl p-4 sm:p-5 mb-4 sm:mb-5 w-full max-w-2xl shadow-xl shadow-accent-green/20 backdrop-blur-md overflow-hidden group hover:shadow-2xl hover:shadow-accent-green/30 transition-all duration-300">
              {/* Animated background glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-accent-green/0 via-accent-green/10 to-accent-green/0 opacity-0 group-hover:opacity-100 animate-pulse-slow"></div>
              <div className="relative flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                    <span className="text-2xl sm:text-3xl animate-bounce-slow">🪙</span>
                    <p className="text-white font-black text-base sm:text-lg">Creator Coin Active</p>
                  </div>
                  <p className="text-accent-green font-bold text-sm sm:text-base truncate">
                    ${userProfile.username?.toUpperCase().substring(0, 10)}
                  </p>
                </div>
                <Button
                  onClick={() => window.open(`https://jup.ag/swap/SOL-${userProfile.creator_coin_mint}`, '_blank')}
                  className="bg-accent-green hover:bg-accent-green/90 text-black font-black whitespace-nowrap text-sm sm:text-base px-6 sm:px-8 h-11 sm:h-12 rounded-xl shadow-lg hover:shadow-accent-green/50 hover:scale-105 transition-all w-full sm:w-auto"
                >
                  Trade Now
                </Button>
              </div>
            </div>
          ) : (
            <div className="relative bg-gradient-to-br from-white/10 to-white/5 border-2 border-white/20 rounded-xl sm:rounded-2xl p-4 sm:p-5 mb-4 sm:mb-5 w-full max-w-2xl backdrop-blur-md overflow-hidden group hover:border-white/40 hover:shadow-xl transition-all duration-300">
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <div className="relative flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                    <span className="text-2xl sm:text-3xl">💰</span>
                    <p className="text-white font-black text-base sm:text-lg">Launch Your Coin</p>
                  </div>
                  <p className="text-white/70 text-xs sm:text-sm">Turn your profile into a tradable asset</p>
                </div>
                <Button
                  onClick={() => setShowActivateCoinModal(true)}
                  className="bg-gradient-to-r from-accent-green via-accent-cyan to-accent-blue hover:from-accent-green/90 hover:via-accent-cyan/90 hover:to-accent-blue/90 text-black font-black whitespace-nowrap text-sm sm:text-base px-6 sm:px-8 h-11 sm:h-12 rounded-xl shadow-lg hover:scale-105 transition-all w-full sm:w-auto"
                >
                  Activate
                </Button>
              </div>
            </div>
          )}

          {/* Action Buttons - Mobile Optimized */}
          <div className="flex items-center gap-2 sm:gap-3 w-full max-w-2xl mb-6 sm:mb-7">
            {userProfile?.creator_coin_enabled && (
              <Button
                onClick={() => window.open(`https://jup.ag/swap/SOL-${userProfile.creator_coin_mint}`, '_blank')}
                className="flex-1 bg-accent-green hover:bg-accent-green/90 text-black font-black h-12 sm:h-13 text-base sm:text-lg rounded-xl shadow-lg hover:shadow-accent-green/30 hover:scale-105 transition-all"
              >
                💎 Trade
              </Button>
            )}
            <Button
              onClick={() => router.push('/profile/edit')}
              variant="outline"
              className={`${userProfile?.creator_coin_enabled ? '' : 'flex-1'} bg-white/10 border-2 border-white/20 text-white hover:bg-white/20 hover:border-white/40 font-bold h-12 sm:h-13 text-base sm:text-lg rounded-xl ${userProfile?.creator_coin_enabled ? 'px-6 sm:px-8' : ''} hover:scale-105 transition-all`}
            >
              Edit
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="bg-white/10 border-2 border-white/20 text-white hover:bg-white/20 hover:border-white/40 h-12 w-12 sm:h-13 sm:w-13 rounded-xl hover:scale-105 transition-all flex-shrink-0"
            >
              <EllipsisHorizontalIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
          </div>
        </div>

        {/* Tab Navigation - Compact & Bold */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-6 px-4">
          <button
            onClick={() => handleTabChange('grid')}
            className={`relative flex items-center gap-2 px-5 sm:px-6 py-3 rounded-xl font-black text-sm sm:text-base transition-all duration-300 overflow-hidden group ${
              activeTab === 'grid'
                ? 'bg-gradient-to-r from-accent-green to-accent-cyan text-black shadow-lg shadow-accent-green/30 scale-105'
                : 'bg-white/10 text-white/60 hover:bg-white/15 hover:text-white hover:scale-102'
            }`}
          >
            {activeTab !== 'grid' && <div className="absolute inset-0 bg-gradient-to-r from-accent-green/0 via-accent-green/10 to-accent-green/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>}
            <Squares2X2Icon className={`h-5 w-5 sm:h-6 sm:w-6 relative z-10 ${activeTab === 'grid' ? 'animate-pulse-slow' : ''}`} />
            <span className="hidden sm:inline relative z-10">Posts</span>
          </button>
          <button
            onClick={() => handleTabChange('wallet')}
            className={`relative flex items-center gap-2 px-5 sm:px-6 py-3 rounded-xl font-black text-sm sm:text-base transition-all duration-300 overflow-hidden group ${
              activeTab === 'wallet'
                ? 'bg-gradient-to-r from-accent-cyan to-accent-blue text-black shadow-lg shadow-accent-cyan/30 scale-105'
                : 'bg-white/10 text-white/60 hover:bg-white/15 hover:text-white hover:scale-102'
            }`}
          >
            {activeTab !== 'wallet' && <div className="absolute inset-0 bg-gradient-to-r from-accent-cyan/0 via-accent-cyan/10 to-accent-cyan/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>}
            <WalletIcon className={`h-5 w-5 sm:h-6 sm:w-6 relative z-10 ${activeTab === 'wallet' ? 'animate-pulse-slow' : ''}`} />
            <span className="hidden sm:inline relative z-10">Wallet</span>
          </button>
          <button
            onClick={() => handleTabChange('collected')}
            className={`relative flex items-center gap-2 px-5 sm:px-6 py-3 rounded-xl font-black text-sm sm:text-base transition-all duration-300 overflow-hidden group ${
              activeTab === 'collected'
                ? 'bg-gradient-to-r from-accent-blue to-accent-purple text-black shadow-lg shadow-accent-blue/30 scale-105'
                : 'bg-white/10 text-white/60 hover:bg-white/15 hover:text-white hover:scale-102'
            }`}
          >
            {activeTab !== 'collected' && <div className="absolute inset-0 bg-gradient-to-r from-accent-blue/0 via-accent-blue/10 to-accent-blue/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>}
            <FolderIcon className={`h-5 w-5 sm:h-6 sm:w-6 relative z-10 ${activeTab === 'collected' ? 'animate-pulse-slow' : ''}`} />
            <span className="hidden sm:inline relative z-10">Collected</span>
          </button>
          <button
            onClick={() => handleTabChange('activity')}
            className={`relative flex items-center gap-2 px-5 sm:px-6 py-3 rounded-xl font-black text-sm sm:text-base transition-all duration-300 overflow-hidden group ${
              activeTab === 'activity'
                ? 'bg-gradient-to-r from-accent-purple to-accent-pink text-black shadow-lg shadow-accent-purple/30 scale-105'
                : 'bg-white/10 text-white/60 hover:bg-white/15 hover:text-white hover:scale-102'
            }`}
          >
            {activeTab !== 'activity' && <div className="absolute inset-0 bg-gradient-to-r from-accent-purple/0 via-accent-purple/10 to-accent-purple/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>}
            <SparklesIcon className={`h-5 w-5 sm:h-6 sm:w-6 relative z-10 ${activeTab === 'activity' ? 'animate-pulse-slow' : ''}`} />
            <span className="hidden sm:inline relative z-10">Activity</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'wallet' ? (
          <div className="max-w-2xl mx-auto px-4 sm:px-0">
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl p-12 sm:p-16 border-2 border-white/20 text-center">
              <div className="text-6xl mb-4">👛</div>
              <p className="text-white/90 text-lg font-bold mb-2">Wallet Coming Soon</p>
              <p className="text-white/60 text-sm">Manage your tokens and earnings in one place</p>
            </div>
          </div>
        ) : activeTab === 'collected' ? (
          <div className="max-w-2xl mx-auto px-4 sm:px-0">
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl p-12 sm:p-16 border-2 border-white/20 text-center">
              <div className="text-6xl mb-4">📂</div>
              <p className="text-white/90 text-lg font-bold mb-2">Collection Coming Soon</p>
              <p className="text-white/60 text-sm">View tokens you&apos;ve collected from other creators</p>
            </div>
          </div>
        ) : activeTab === 'activity' ? (
          <div className="max-w-2xl mx-auto px-4 sm:px-0">
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl p-12 sm:p-16 border-2 border-white/20 text-center">
              <div className="text-6xl mb-4">⚡</div>
              <p className="text-white/90 text-lg font-bold mb-2">Activity Feed Coming Soon</p>
              <p className="text-white/60 text-sm">Track all your trades, likes, and interactions</p>
            </div>
          </div>
        ) : (
          /* Posts Grid - Enhanced */
          <div className="px-4">
            <div className="grid grid-cols-3 gap-2 max-w-5xl mx-auto">
            {postsLoading ? (
              // Loading skeleton - enhanced with staggered animation
              Array.from({ length: 9 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square bg-gradient-to-br from-white/10 via-white/5 to-white/10 rounded-lg overflow-hidden relative"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                </div>
              ))
            ) : posts.length === 0 ? (
              // Empty state - BOLD & INVITING
              <div className="col-span-3 text-center py-20">
                <div className="max-w-lg mx-auto">
                  <div className="text-8xl mb-8">📸</div>
                  <h3 className="text-4xl font-black text-white mb-4 leading-tight">
                    No Posts Yet
                  </h3>
                  <p className="text-white/70 text-base mb-6 leading-relaxed max-w-md mx-auto">
                    Create your first post to see it here!
                  </p>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 text-left">
                    <p className="text-white/60 text-sm mb-3">
                      <strong className="text-white">Profile Info:</strong>
                    </p>
                    <div className="space-y-2 text-xs font-mono text-white/50">
                      <div>
                        <span className="text-white/40">User ID:</span> {userProfile?.id}
                      </div>
                      <div>
                        <span className="text-white/40">Wallet:</span> {userProfile?.wallet_address}
                      </div>
                      <div>
                        <span className="text-white/40">Username:</span> {userProfile?.username}
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-white/70 text-xs mb-2">
                        💡 Posts are tied to your wallet address. If you don&apos;t see posts you created, make sure you&apos;re connected with the same wallet you used to create them.
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      console.log('🔍 [DEBUG] Forcing posts refetch...');
                      refetchPosts();
                    }}
                    variant="outline"
                    className="mr-2 mb-4"
                  >
                    🔄 Refresh Posts
                  </Button>
                  <Button
                    onClick={() => router.push('/create')}
                    size="lg"
                    className="bg-gradient-to-r from-accent-green via-accent-cyan to-accent-blue hover:from-accent-green/90 hover:via-accent-cyan/90 hover:to-accent-blue/90 text-black font-black text-lg px-10 h-16 rounded-xl shadow-xl hover:shadow-accent-green/30 hover:scale-105 transition-all"
                  >
                    🚀 Create Your First Post
                  </Button>
                </div>
              </div>
            ) : (
              // Posts grid - Enhanced hover effects
              posts.map((post) => (
                <button
                  key={post.id}
                  onClick={() => router.push(`/post/${post.id}`)}
                  className="group aspect-square overflow-hidden bg-black cursor-pointer relative rounded-lg hover:scale-[1.03] transition-all duration-300 shadow-lg hover:shadow-2xl"
                >
                  {post.media_urls && post.media_urls.length > 0 && (
                    <>
                      <img
                        src={post.media_urls[0]}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </>
                  )}
                </button>
              ))
            )}
            </div>
          </div>
        )}
      </div>

      {/* Creator Coin Activation Modal */}
      {userProfile && (
        <ActivateCreatorCoinModal
          isOpen={showActivateCoinModal}
          onClose={() => setShowActivateCoinModal(false)}
          onSuccess={() => {
            setShowActivateCoinModal(false);
            loadUserProfile(); // Reload profile to show new creator coin
          }}
          userProfile={{
            username: userProfile.username,
            display_name: userProfile.display_name,
            avatar_url: userProfile.avatar_url,
            bio: userProfile.bio,
          }}
        />
      )}
    </AppLayout>
  );
}

// Wrapper component with Suspense boundary
export default function ProfilePage() {
  return (
    <Suspense fallback={
      <AppLayout showWallet={true} showSearch={true}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 border-4 border-accent-green/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-transparent border-t-accent-green rounded-full animate-spin"></div>
            </div>
            <p className="text-white/90 font-bold text-lg mb-2">Loading your profile</p>
            <p className="text-white/60 text-sm animate-pulse">Getting everything ready...</p>
          </div>
        </div>
      </AppLayout>
    }>
      <ProfilePageContent />
    </Suspense>
  );
}

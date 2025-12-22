'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@jup-ag/wallet-adapter';
import { useRouter, useParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  UserPlusIcon,
  UserMinusIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  CurrencyDollarIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  Squares2X2Icon,
  FolderIcon,
  SparklesIcon,
  EllipsisHorizontalIcon,
  WalletIcon
} from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';
import { FlexPost } from '@/types';
import { LoadingSpinner } from '@/components/ui/loading';
import { ActivateCreatorCoinModal } from '@/components/creator-coin/ActivateCreatorCoinModal';
import { toast } from 'sonner';
import { usePosts } from '@/hooks/usePosts';
import { useUserStats } from '@/hooks/useUserStats';
import { WalletTab } from '@/components/profile/WalletTab';
import { CollectedTab } from '@/components/profile/CollectedTab';
import { ActivityTab } from '@/components/profile/ActivityTab';

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
  verified: boolean;
  success_tier: string;
  created_at: string;
  creator_coin_enabled?: boolean;
  creator_coin_mint?: string;
  creator_coin_pool?: string;
  creator_coin_metadata_uri?: string;
}

export default function UserProfileViewPage() {
  const { connected, publicKey } = useWallet();
  const router = useRouter();
  const params = useParams();
  const username = params.username as string;

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'grid' | 'collected' | 'activity' | 'wallet'>('grid');
  const [showActivateCoinModal, setShowActivateCoinModal] = useState(false);

  // Fetch current user ID from wallet
  useEffect(() => {
    async function fetchCurrentUser() {
      if (!connected || !publicKey || !supabase) {
        setCurrentUserId(null);
        return;
      }

      const { data } = await supabase
        .from('users')
        .select('id')
        .eq('wallet_address', publicKey.toBase58())
        .single();

      if (data) {
        setCurrentUserId(data.id);
      }
    }
    fetchCurrentUser();
  }, [connected, publicKey]);

  // Load user profile
  useEffect(() => {
    if (username) {
      loadUserProfile();
    }
  }, [username]);

  const loadUserProfile = async () => {
    if (!supabase) {
      console.error('Supabase not configured');
      setLoading(false);
      return;
    }

    try {
      console.log('🔍 Loading profile for username:', username);
      setLoading(true);

      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

      if (error) {
        console.error('❌ Error loading profile:', error);
        toast.error('User not found');
        router.push('/explore');
        return;
      }

      setProfile(user);
      console.log('✅ Profile loaded:', user);
    } catch (error) {
      console.error('❌ Error loading profile:', error);
      toast.error('Failed to load profile');
      router.push('/explore');
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's posts using the hook
  const { data: postsData, isLoading: postsLoading, refetch: refetchPosts } = usePosts({
    userId: profile?.id,
    enabled: !!profile?.id
  });

  const posts = postsData?.data?.posts || [];

  // Fetch real user stats using the hook
  const { data: statsData, isLoading: statsLoading, refetch: refetchStats } = useUserStats(profile?.id);

  // EXTENSIVE DEBUGGING
  useEffect(() => {
    if (profile) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔍 [PROFILE DEBUG] Profile loaded');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('👤 User Info:');
      console.log('   - ID:', profile.id);
      console.log('   - Username:', profile.username);
      console.log('   - Wallet:', profile.wallet_address);
      console.log('');
      console.log('📊 Posts Data:');
      console.log('   - Loading:', postsLoading);
      console.log('   - Raw data:', postsData);
      console.log('   - Posts array:', posts);
      console.log('   - Posts count:', posts.length);
      console.log('');
      console.log('📈 Stats Data:');
      console.log('   - Loading:', statsLoading);
      console.log('   - Stats:', statsData);
      console.log('   - Post count from stats:', statsData?.data?.posts_count);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }
  }, [profile, postsData, posts, postsLoading, statsData, statsLoading]);

  // Force refresh when profile changes
  useEffect(() => {
    if (profile?.id) {
      console.log('🔄 [PROFILE] Refreshing data for user:', profile.id);
      refetchPosts();
      refetchStats();
    }
  }, [profile?.id, refetchPosts, refetchStats]);

  const handleFollow = async () => {
    if (!currentUserId || !profile) return;

    try {
      // In real app, update followers table
      setFollowing(!following);
      toast.success(following ? 'Unfollowed' : 'Following!');
    } catch (error) {
      console.error('Error updating follow status:', error);
      toast.error('Failed to update follow status');
    }
  };

  const copyWalletAddress = () => {
    if (!profile?.wallet_address) return;

    navigator.clipboard.writeText(profile.wallet_address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Wallet address copied!');
  };

  // Check if this is the current user's own profile
  const isOwnProfile = connected && publicKey && profile?.wallet_address === publicKey.toBase58();

  // Tab change handler
  const handleTabChange = (tab: 'grid' | 'collected' | 'activity' | 'wallet') => {
    setActiveTab(tab);
  };

  if (loading) {
    return (
      <AppLayout showWallet={true} showSearch={true}>
        <LoadingSpinner message="Loading profile" submessage="Getting everything ready..." />
      </AppLayout>
    );
  }

  if (!profile) {
    return (
      <AppLayout showWallet={true} showSearch={true}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">User Not Found</h2>
            <p className="text-white/70 mb-6">This profile doesn't exist</p>
            <Button onClick={() => router.push('/explore')} className="bg-purple-500 hover:bg-purple-600">
              Back to Explore
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showWallet={true} showSearch={true}>
      <div className="w-full max-w-5xl mx-auto pb-20 md:pb-8">
        {/* Cover Image */}
        {profile.cover_url ? (
          <div
            className="h-40 sm:h-48 md:h-56 sm:rounded-2xl mb-12 sm:mb-16 bg-cover bg-center relative overflow-hidden group"
            style={{ backgroundImage: `url(${profile.cover_url})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-accent-green/0 via-accent-cyan/10 to-accent-blue/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          </div>
        ) : (
          <div className="h-40 sm:h-48 md:h-56 sm:rounded-2xl mb-12 sm:mb-16 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-accent-green/20 via-accent-cyan/20 to-accent-blue/20 animate-gradient-shift"></div>
            <div className="absolute inset-0 bg-gradient-to-tl from-accent-purple/10 via-transparent to-accent-pink/10 animate-pulse"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70"></div>
            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-accent-green/30 rounded-full blur-3xl animate-float"></div>
            <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-accent-cyan/20 rounded-full blur-3xl animate-float-delayed"></div>
          </div>
        )}

        {/* Profile Header */}
        <div className="flex flex-col items-center text-center px-4 sm:px-6 -mt-8 sm:-mt-12">
          {/* Avatar */}
          <Avatar className="h-28 w-28 sm:h-32 sm:w-32 mb-3 sm:mb-4 ring-4 ring-accent-green/40 shadow-2xl shadow-accent-green/30 border-4 border-black">
            <AvatarImage src={profile.avatar_url} />
            <AvatarFallback className="bg-gradient-to-br from-accent-green via-accent-cyan to-accent-blue text-black font-black text-4xl sm:text-5xl">
              {profile.display_name?.[0]?.toUpperCase() || profile.username?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>

          {/* Display Name */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-1 sm:mb-2 tracking-tight leading-none">
            {profile.display_name || 'Anonymous User'}
          </h1>

          {/* Username */}
          <p className="text-white/70 mb-3 sm:mb-4 text-sm sm:text-base font-semibold">
            @{profile.username || 'unknown'}
          </p>

          {/* Bio */}
          {profile.bio && (
            <p className="text-white/90 text-sm sm:text-base mb-3 sm:mb-4 max-w-xl leading-relaxed">
              {profile.bio}
            </p>
          )}

          {/* Wallet Address Badge */}
          <button
            onClick={copyWalletAddress}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full text-white/90 text-xs sm:text-sm mb-4 sm:mb-5 transition-all font-mono border border-white/20 hover:border-accent-green/50 hover:shadow-lg hover:shadow-accent-green/20"
          >
            <span>💎</span>
            <span>{profile.wallet_address.slice(0, 4)}...{profile.wallet_address.slice(-4)}</span>
            {copied && <CheckIcon className="w-4 h-4 text-green-400" />}
          </button>

          {/* Social Links */}
          {(profile.twitter || profile.instagram || profile.website) && (
            <div className="flex items-center gap-4 sm:gap-5 mb-4 sm:mb-5">
              {profile.twitter && (
                <a
                  href={`https://twitter.com/${profile.twitter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-accent-cyan transition-all hover:scale-110 transform p-2 rounded-lg hover:bg-white/10"
                >
                  <svg width="24" height="24" className="sm:w-7 sm:h-7" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
              )}
              {profile.instagram && (
                <a
                  href={`https://instagram.com/${profile.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-accent-pink transition-all text-2xl sm:text-3xl hover:scale-110 transform p-2 rounded-lg hover:bg-white/10"
                >
                  📷
                </a>
              )}
              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-accent-blue transition-all text-2xl sm:text-3xl hover:scale-110 transform p-2 rounded-lg hover:bg-white/10"
                >
                  🌐
                </a>
              )}
            </div>
          )}

          {/* Stats Row */}
          <div className="flex items-stretch gap-2 sm:gap-3 mb-5 sm:mb-6 w-full max-w-2xl">
            {/* Posts Count */}
            <div className="flex-1 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/10 hover:border-accent-green/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-accent-green/20 cursor-pointer group">
              {statsLoading ? (
                <div className="h-10 w-16 bg-white/10 animate-pulse rounded mb-1"></div>
              ) : (
                <div className="text-3xl sm:text-4xl font-black mb-1 bg-gradient-to-r from-accent-green to-accent-cyan bg-clip-text text-transparent leading-none group-hover:scale-110 transition-transform duration-300">
                  {statsData?.data?.posts_count || 0}
                </div>
              )}
              <div className="text-white/60 group-hover:text-white/80 text-xs sm:text-sm font-semibold transition-colors">Posts</div>
            </div>

            {/* Tokens Created */}
            <div className="flex-1 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/10 hover:border-accent-cyan/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-accent-cyan/20 cursor-pointer group">
              {statsLoading ? (
                <div className="h-10 w-16 bg-white/10 animate-pulse rounded mb-1"></div>
              ) : (
                <div className="text-3xl sm:text-4xl font-black mb-1 bg-gradient-to-r from-accent-cyan to-accent-blue bg-clip-text text-transparent leading-none group-hover:scale-110 transition-transform duration-300">
                  {statsData?.data?.tokens_created || 0}
                </div>
              )}
              <div className="text-white/60 group-hover:text-white/80 text-xs sm:text-sm font-semibold transition-colors">Tokens</div>
            </div>

            {/* Total Value */}
            <div className="flex-1 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/10 hover:border-accent-blue/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-accent-blue/20 cursor-pointer group relative">
              <div className="text-3xl sm:text-4xl font-black mb-1 bg-gradient-to-r from-accent-blue to-accent-purple bg-clip-text text-transparent leading-none group-hover:scale-110 transition-transform duration-300">
                --
              </div>
              <div className="text-white/60 group-hover:text-white/80 text-xs sm:text-sm font-semibold transition-colors">Value</div>
              <div className="absolute top-1 right-1 text-[8px] text-white/40 font-mono">Soon</div>
            </div>
          </div>

          {/* Creator Coin Status - Only shown if user has activated */}
          {profile.creator_coin_enabled && (
            <div className="relative bg-gradient-to-br from-accent-green/20 via-accent-cyan/20 to-accent-blue/20 border-2 border-accent-green/40 rounded-xl sm:rounded-2xl p-4 sm:p-5 mb-4 sm:mb-5 w-full max-w-2xl shadow-xl shadow-accent-green/20 backdrop-blur-md overflow-hidden group hover:shadow-2xl hover:shadow-accent-green/30 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-r from-accent-green/0 via-accent-green/10 to-accent-green/0 opacity-0 group-hover:opacity-100 animate-pulse-slow"></div>
              <div className="relative flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                    <span className="text-2xl sm:text-3xl animate-bounce-slow">🪙</span>
                    <p className="text-white font-black text-base sm:text-lg">Creator Coin Active</p>
                  </div>
                  <p className="text-accent-green font-bold text-sm sm:text-base truncate">
                    ${profile.username?.toUpperCase().substring(0, 10)}
                  </p>
                </div>
                <Button
                  onClick={() => window.open(`https://jup.ag/swap/SOL-${profile.creator_coin_mint}`, '_blank')}
                  className="bg-accent-green hover:bg-accent-green/90 text-black font-black whitespace-nowrap text-sm sm:text-base px-6 sm:px-8 h-11 sm:h-12 rounded-xl shadow-lg hover:shadow-accent-green/50 hover:scale-105 transition-all w-full sm:w-auto"
                >
                  Trade Now
                </Button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3 w-full max-w-2xl mb-6 sm:mb-7">
            {isOwnProfile ? (
              <>
                {profile.creator_coin_enabled && (
                  <Button
                    onClick={() => window.open(`https://jup.ag/swap/SOL-${profile.creator_coin_mint}`, '_blank')}
                    className="flex-1 bg-accent-green hover:bg-accent-green/90 text-black font-black h-12 sm:h-13 text-base sm:text-lg rounded-xl shadow-lg hover:shadow-accent-green/30 hover:scale-105 transition-all"
                  >
                    💎 Trade
                  </Button>
                )}
                <Button
                  onClick={() => router.push('/profile/edit')}
                  variant="outline"
                  className={`${profile.creator_coin_enabled ? '' : 'flex-1'} bg-white/10 border-2 border-white/20 text-white hover:bg-white/20 hover:border-white/40 font-bold h-12 sm:h-13 text-base sm:text-lg rounded-xl ${profile.creator_coin_enabled ? 'px-6 sm:px-8' : ''} hover:scale-105 transition-all`}
                >
                  Edit
                </Button>
                {!profile.creator_coin_enabled && (
                  <Button
                    onClick={() => setShowActivateCoinModal(true)}
                    className="flex-1 bg-gradient-to-r from-accent-green via-accent-cyan to-accent-blue hover:from-accent-green/90 hover:via-accent-cyan/90 hover:to-accent-blue/90 text-black font-black h-12 sm:h-13 text-base sm:text-lg rounded-xl hover:scale-105 transition-all"
                  >
                    Activate Coin
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button
                  onClick={handleFollow}
                  className={`flex-1 font-black h-12 sm:h-13 text-base sm:text-lg rounded-xl hover:scale-105 transition-all ${
                    following
                      ? 'bg-white/10 border-2 border-white/20 text-white hover:bg-white/20 hover:border-white/40'
                      : 'bg-gradient-to-r from-accent-green via-accent-cyan to-accent-blue text-black hover:from-accent-green/90 hover:via-accent-cyan/90 hover:to-accent-blue/90'
                  }`}
                >
                  {following ? (
                    <>
                      <UserMinusIcon className="h-5 w-5 mr-2" />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlusIcon className="h-5 w-5 mr-2" />
                      Follow
                    </>
                  )}
                </Button>
                {profile.creator_coin_enabled && (
                  <Button
                    onClick={() => window.open(`https://jup.ag/swap/SOL-${profile.creator_coin_mint}`, '_blank')}
                    className="flex-1 bg-accent-green hover:bg-accent-green/90 text-black font-black h-12 sm:h-13 text-base sm:text-lg rounded-xl shadow-lg hover:shadow-accent-green/30 hover:scale-105 transition-all"
                  >
                    💎 Trade
                  </Button>
                )}
              </>
            )}
            <Button
              variant="outline"
              size="icon"
              className="bg-white/10 border-2 border-white/20 text-white hover:bg-white/20 hover:border-white/40 h-12 w-12 sm:h-13 sm:w-13 rounded-xl hover:scale-105 transition-all flex-shrink-0"
            >
              <ShareIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
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
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <WalletTab userId={profile.id} walletAddress={profile.wallet_address} />
          </div>
        ) : activeTab === 'collected' ? (
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <CollectedTab userId={profile.id} walletAddress={profile.wallet_address} />
          </div>
        ) : activeTab === 'activity' ? (
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <ActivityTab userId={profile.id} walletAddress={profile.wallet_address} />
          </div>
        ) : (
          /* Posts Grid */
          <div className="px-4">
            <div className="grid grid-cols-3 gap-2 max-w-5xl mx-auto">
            {postsLoading ? (
              // Loading skeleton
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
              // Empty state
              <div className="col-span-3 text-center py-20">
                <div className="max-w-lg mx-auto">
                  <div className="text-8xl mb-8">📸</div>
                  <h3 className="text-4xl font-black text-white mb-4 leading-tight">
                    No Posts Yet
                  </h3>
                  <p className="text-white/70 text-base mb-6 leading-relaxed max-w-md mx-auto">
                    {isOwnProfile ? 'Create your first post to see it here!' : `${profile.display_name} hasn't posted yet`}
                  </p>
                  {isOwnProfile && (
                    <>
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
                    </>
                  )}
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
      {profile && isOwnProfile && (
        <ActivateCreatorCoinModal
          isOpen={showActivateCoinModal}
          onClose={() => setShowActivateCoinModal(false)}
          onSuccess={() => {
            setShowActivateCoinModal(false);
            loadUserProfile(); // Reload profile to show new creator coin
          }}
          userProfile={{
            username: profile.username,
            display_name: profile.display_name,
            avatar_url: profile.avatar_url,
            bio: profile.bio,
          }}
        />
      )}
    </AppLayout>
  );
}

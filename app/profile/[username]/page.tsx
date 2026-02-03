'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWalletCompat';
import { useRouter, useParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { RankBadge } from '@/components/ui/RankBadge';
import {
  UserPlusIcon,
  UserMinusIcon,
  ShareIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  Squares2X2Icon,
  CurrencyDollarIcon,
  WalletIcon,
  PencilSquareIcon,
  SparklesIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import { CheckBadgeIcon, ChartBarIcon, ShieldCheckIcon, FireIcon } from '@heroicons/react/24/solid';
import { ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { FlexPost } from '@/types';
import { LoadingSpinner } from '@/components/ui/loading';
import { ActivateCreatorCoinModal } from '@/components/creator-coin/ActivateCreatorCoinModal';
import { toast } from 'sonner';
import { usePosts } from '@/hooks/usePosts';
import { useUserStats } from '@/hooks/useUserStats';
import { cn } from '@/lib/utils';

// New components
import {
  CreatorTokenCard,
  ProfileStatBar,
  PostGrid,
  LiveTradeTicker,
  WalletTab,
  CollectedTab,
  ActivityTab,
  TokensTab,
  LikesTab,
  AnalyticsDashboard,
} from '@/components/profile';

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
  tiktok?: string;
  verified: boolean;
  profile_completed?: boolean;
  success_tier: string;
  created_at: string;
  creator_coin_enabled?: boolean;
  creator_coin_mint?: string;
  creator_coin_pool?: string;
  creator_coin_metadata_uri?: string;
  twitter_verified?: boolean;
  twitter_followers?: number;
  twitter_verified_at?: string;
  youtube_verified?: boolean;
  youtube_subscribers?: number;
  youtube_channel_name?: string;
  youtube_verified_at?: string;
  tiktok_verified?: boolean;
  tiktok_followers?: number;
  tiktok_verified_at?: string;
  trust_score?: number;
}

export default function UserProfileViewPage() {
  const { connected, publicKey, ready } = useWallet();
  const router = useRouter();
  const params = useParams();
  const username = params.username as string;

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingProfile, setCreatingProfile] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'grid' | 'tokens' | 'wallet' | 'collected' | 'activity' | 'analytics'>('grid');
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

  useEffect(() => {
    if (username) {
      loadUserProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, connected, publicKey]);

  const loadUserProfile = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setIsNewUser(false);

      const isWalletAddress = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(username);
      let user: UserProfile | null = null;
      let error: { code?: string; message?: string } | null = null;

      if (isWalletAddress) {
        const result = await supabase
          .from('users')
          .select('*')
          .eq('wallet_address', username)
          .single();

        user = result.data as UserProfile | null;
        error = result.error;

        if (error && error.code === 'PGRST116') {
          const usernameResult = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .single();
          user = usernameResult.data as UserProfile | null;
          error = usernameResult.error;
        }
      } else {
        const result = await supabase
          .from('users')
          .select('*')
          .eq('username', username)
          .single();
        user = result.data as UserProfile | null;
        error = result.error;
      }

      if (error && error.code === 'PGRST116' && isWalletAddress) {
        const currentWallet = publicKey?.toBase58();
        if (connected && currentWallet === username) {
          await createProfileLazily(username);
          return;
        }
      }

      if (error) {
        setLoading(false);
        return;
      }

      if (!user) {
        setLoading(false);
        return;
      }

      const hasAutoUsername = !!user.username?.match(/^user[a-z0-9]{10,}$/);
      const profileNotCompleted = !user.profile_completed;
      setIsNewUser(hasAutoUsername || profileNotCompleted);

      // Mock follower count - replace with real data
      setFollowerCount(Math.floor(Math.random() * 10000));

      setProfile(user);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const createProfileLazily = async (walletAddress: string) => {
    setCreatingProfile(true);

    try {
      const response = await fetch('/api/users/ensure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress }),
      });

      const data = await response.json();

      if (data.success && data.user) {
        setProfile(data.user);
        setIsNewUser(data.isNewUser || data.needsProfileSetup);
        sessionStorage.setItem('current_username', data.user.username);
        sessionStorage.setItem('current_user', JSON.stringify(data.user));
        if (data.needsProfileSetup) {
          sessionStorage.setItem('needs_profile_setup', 'true');
        }
      } else {
        toast.error('Failed to create profile');
      }
    } catch (error) {
      console.error('Error creating profile:', error);
      toast.error('Failed to create profile');
    } finally {
      setCreatingProfile(false);
      setLoading(false);
    }
  };

  const { data: postsData, isLoading: postsLoading, refetch: refetchPosts } = usePosts({
    userId: profile?.id,
    enabled: !!profile?.id
  });

  const posts = postsData?.data?.posts || [];

  const { data: statsData, isLoading: statsLoading, refetch: refetchStats } = useUserStats(profile?.id);

  useEffect(() => {
    if (profile?.id) {
      refetchPosts();
      refetchStats();
    }
  }, [profile?.id, refetchPosts, refetchStats]);

  const handleFollow = async () => {
    if (!currentUserId || !profile) return;
    setFollowing(!following);
    setFollowerCount(prev => following ? prev - 1 : prev + 1);
    toast.success(following ? 'Unfollowed' : 'Following!');
  };

  const copyWalletAddress = () => {
    if (!profile?.wallet_address) return;
    navigator.clipboard.writeText(profile.wallet_address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Wallet address copied!');
  };

  const isOwnProfile = ready && connected && publicKey && profile?.wallet_address === publicKey.toBase58();

  const formatFollowers = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const verifiedPlatformsCount = profile ? [
    profile.twitter_verified,
    profile.youtube_verified,
    profile.tiktok_verified,
  ].filter(Boolean).length : 0;

  // Get rank from stats (mock for now)
  const userRank = 42;
  const rankDelta = 15;

  if (loading || creatingProfile) {
    return (
      <AppLayout showWallet={true} showSearch={true}>
        <LoadingSpinner
          message={creatingProfile ? "Setting up your profile" : "Loading profile"}
          submessage={creatingProfile ? "This will only take a moment..." : "Getting everything ready..."}
        />
      </AppLayout>
    );
  }

  const isWalletAddress = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(username);
  const isOwnWallet = connected && publicKey && isWalletAddress && publicKey.toBase58() === username;

  if (!profile) {
    if (isOwnWallet && !creatingProfile) {
      return (
        <AppLayout showWallet={true} showSearch={true}>
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center max-w-md">
              <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-neon-lime/20 to-neon-cyan/20 border-2 border-dashed border-neon-lime/30 flex items-center justify-center">
                <SparklesIcon className="w-10 h-10 text-neon-lime" />
              </div>
              <h2 className="text-3xl font-black text-white mb-3 font-display">Welcome to Flexit!</h2>
              <p className="text-white/60 mb-8">Create your profile to start earning from your content.</p>
              <Button
                onClick={() => createProfileLazily(username)}
                className="btn-primary text-lg px-8 py-4"
              >
                Create My Profile
              </Button>
            </div>
          </div>
        </AppLayout>
      );
    }

    return (
      <AppLayout showWallet={true} showSearch={true}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md">
            <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <span className="text-5xl">👤</span>
            </div>
            <h2 className="text-3xl font-black text-white mb-3 font-display">Profile Not Found</h2>
            <p className="text-white/60 mb-8">This profile doesn't exist yet.</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => loadUserProfile()} variant="outline" className="border-white/20">
                Try Again
              </Button>
              <Button onClick={() => router.push('/')} className="btn-primary">
                Go Home
              </Button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  const tokenSymbol = profile.username?.toUpperCase().substring(0, 8) || 'TOKEN';

  return (
    <AppLayout showWallet={true} showSearch={true}>
      <div className="w-full max-w-6xl mx-auto pb-20 md:pb-8">
        {/* Cover Image */}
        <div className="relative">
          {profile.cover_url ? (
            <div
              className="h-48 sm:h-56 md:h-72 sm:rounded-2xl bg-cover bg-center relative overflow-hidden"
              style={{ backgroundImage: `url(${profile.cover_url})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black" />
            </div>
          ) : (
            <div className="h-48 sm:h-56 md:h-72 sm:rounded-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-neon-lime/20 via-neon-cyan/10 to-neon-purple/20" />
              <div className="absolute inset-0 bg-grid-glow opacity-30" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black" />
              {/* Floating orbs */}
              <div className="absolute top-1/4 left-1/4 w-40 h-40 bg-neon-lime/20 rounded-full blur-3xl animate-float" />
              <div className="absolute bottom-1/4 right-1/4 w-56 h-56 bg-neon-cyan/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
            </div>
          )}

          {/* Floating Avatar */}
          <div className="absolute -bottom-14 sm:-bottom-12 left-1/2 -translate-x-1/2 sm:left-6 sm:translate-x-0 z-10">
            <div className="relative">
              <Avatar className={cn(
                'h-28 w-28 sm:h-32 sm:w-32 border-4 border-black',
                'ring-4 ring-neon-lime/40 shadow-2xl shadow-neon-lime/20'
              )}>
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="bg-gradient-to-br from-neon-lime via-neon-cyan to-neon-purple text-black font-black text-5xl">
                  {profile.display_name?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>

              {/* Rank Badge */}
              <div className="absolute -bottom-2 -right-2">
                <RankBadge rank={userRank} size="md" showRank={true} />
              </div>

              {/* Verified Badge */}
              {profile.verified && (
                <div className="absolute -top-1 -right-1">
                  <div className="w-8 h-8 rounded-full bg-neon-lime flex items-center justify-center shadow-glow-lime">
                    <CheckBadgeIcon className="w-5 h-5 text-black" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profile Header */}
        <div className="pt-16 sm:pt-8 sm:pl-44 px-4 sm:px-6">
          {/* New User Banner */}
          {isNewUser && isOwnProfile && (
            <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-neon-purple/20 to-neon-coral/20 border border-neon-purple/30">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <span className="text-3xl">✨</span>
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-white font-bold">Complete Your Profile</h3>
                  <p className="text-white/60 text-sm">Add a username, bio, and avatar to stand out</p>
                </div>
                <Button onClick={() => router.push('/profile/edit')} className="btn-accent whitespace-nowrap">
                  Complete Setup
                </Button>
              </div>
            </div>
          )}

          {/* Name, Username, Followers Row */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div className="text-center sm:text-left">
              <h1 className="text-3xl sm:text-4xl font-black text-white mb-1 font-display tracking-tight">
                {profile.display_name || 'Anonymous'}
              </h1>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-white/60">
                <span className="font-medium">@{profile.username}</span>
                <span className="text-white/30">•</span>
                <span className="font-semibold text-white/80">{formatFollowers(followerCount)} followers</span>
                {verifiedPlatformsCount > 0 && (
                  <>
                    <span className="text-white/30">•</span>
                    <span className="flex items-center gap-1 text-gain">
                      <ShieldCheckIcon className="w-4 h-4" />
                      {verifiedPlatformsCount} verified
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center sm:justify-end gap-2">
              {isOwnProfile ? (
                <>
                  <Button
                    onClick={() => router.push('/profile/edit')}
                    variant="outline"
                    className="border-white/20 hover:border-white/40"
                  >
                    <PencilSquareIcon className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  {!profile.creator_coin_enabled && (
                    <Button
                      onClick={() => setShowActivateCoinModal(true)}
                      className="btn-primary"
                    >
                      <FireIcon className="w-4 h-4 mr-2" />
                      Activate Coin
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button
                    onClick={handleFollow}
                    className={cn(
                      following
                        ? 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
                        : 'btn-primary'
                    )}
                  >
                    {following ? (
                      <>
                        <UserMinusIcon className="w-4 h-4 mr-2" />
                        Following
                      </>
                    ) : (
                      <>
                        <UserPlusIcon className="w-4 h-4 mr-2" />
                        Follow
                      </>
                    )}
                  </Button>
                  {profile.creator_coin_enabled && (
                    <Button
                      onClick={() => window.open(`https://jup.ag/swap/SOL-${profile.creator_coin_mint}`, '_blank')}
                      className="btn-trade-buy"
                    >
                      Trade ${tokenSymbol}
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </Button>
                  )}
                </>
              )}
              <Button
                variant="outline"
                size="icon"
                onClick={copyWalletAddress}
                className="border-white/20 hover:border-white/40"
              >
                {copied ? <CheckIcon className="w-4 h-4 text-gain" /> : <ShareIcon className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-white/80 text-center sm:text-left max-w-2xl mb-6 leading-relaxed">
              {profile.bio}
            </p>
          )}

          {/* Social Links */}
          {(profile.twitter || profile.youtube_verified || profile.tiktok || profile.instagram || profile.website) && (
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-6">
              {profile.twitter && (
                <a
                  href={`https://twitter.com/${profile.twitter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg transition-all hover:scale-105',
                    profile.twitter_verified
                      ? 'bg-zinc-800 border border-zinc-600'
                      : 'bg-white/5 border border-white/10'
                  )}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  {profile.twitter_verified && (
                    <>
                      <CheckBadgeIcon className="w-4 h-4 text-gain" />
                      <span className="text-xs text-white/60">{formatFollowers(profile.twitter_followers || 0)}</span>
                    </>
                  )}
                </a>
              )}

              {profile.youtube_verified && profile.youtube_channel_name && (
                <a
                  href={`https://youtube.com/@${profile.youtube_channel_name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-950 border border-red-800 transition-all hover:scale-105"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#EF4444">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" />
                  </svg>
                  <CheckBadgeIcon className="w-4 h-4 text-gain" />
                  <span className="text-xs text-white/60">{formatFollowers(profile.youtube_subscribers || 0)}</span>
                </a>
              )}

              {profile.tiktok && (
                <a
                  href={`https://tiktok.com/@${profile.tiktok}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg transition-all hover:scale-105',
                    profile.tiktok_verified
                      ? 'bg-gradient-to-r from-pink-950 to-cyan-950 border border-pink-700'
                      : 'bg-white/5 border border-white/10'
                  )}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill={profile.tiktok_verified ? '#F472B6' : 'currentColor'}>
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                  </svg>
                  {profile.tiktok_verified && (
                    <>
                      <CheckBadgeIcon className="w-4 h-4 text-gain" />
                      <span className="text-xs text-white/60">{formatFollowers(profile.tiktok_followers || 0)}</span>
                    </>
                  )}
                </a>
              )}

              {profile.instagram && (
                <a
                  href={`https://instagram.com/${profile.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-900/50 to-pink-900/50 border border-purple-700/50 transition-all hover:scale-105"
                >
                  <span className="text-base">📷</span>
                </a>
              )}

              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 transition-all hover:scale-105"
                >
                  <GlobeAltIcon className="w-4 h-4 text-white/60" />
                </a>
              )}

              {/* Wallet Address */}
              <button
                onClick={copyWalletAddress}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-neon-lime/30 transition-all font-mono text-xs"
              >
                <span className="text-white/60">
                  {profile.wallet_address.slice(0, 4)}...{profile.wallet_address.slice(-4)}
                </span>
                {copied ? (
                  <CheckIcon className="w-3 h-3 text-gain" />
                ) : (
                  <ClipboardDocumentIcon className="w-3 h-3 text-white/40" />
                )}
              </button>
            </div>
          )}

          {/* Stats Bar */}
          <div className="mb-8">
            <ProfileStatBar
              postsCount={statsData?.data?.posts_count || 0}
              tokensCreated={statsData?.data?.tokens_created || 0}
              totalEarned={0}
              tradesCount={247}
              rank={userRank}
              rankDelta={rankDelta}
              trustScore={profile.trust_score}
              loading={statsLoading}
            />
          </div>

          {/* Creator Token Card */}
          {profile.creator_coin_enabled && profile.creator_coin_mint && (
            <div className="mb-8">
              <CreatorTokenCard
                tokenMint={profile.creator_coin_mint}
                tokenSymbol={tokenSymbol}
                creatorName={profile.display_name || profile.username}
              />
            </div>
          )}

          {/* Activate Coin CTA for own profile */}
          {isOwnProfile && !profile.creator_coin_enabled && (
            <div className="mb-8">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0A0A0A] to-[#0A1A0A] border-2 border-dashed border-neon-lime/30 p-6 group hover:border-neon-lime/50 transition-all cursor-pointer" onClick={() => setShowActivateCoinModal(true)}>
                <div className="absolute inset-0 bg-grid-glow opacity-10" />
                <div className="relative flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-neon-lime/10 border border-neon-lime/30 flex items-center justify-center group-hover:shadow-glow-lime transition-all">
                    <span className="text-3xl">🪙</span>
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="text-xl font-bold text-white mb-1">Launch Your Creator Coin</h3>
                    <p className="text-white/60 text-sm">Let fans invest in you. Earn when they trade your token.</p>
                  </div>
                  <Button className="btn-primary whitespace-nowrap">
                    <FireIcon className="w-4 h-4 mr-2" />
                    Activate Now
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Live Trade Ticker */}
          {profile.creator_coin_enabled && (
            <div className="mb-8 -mx-4 sm:mx-0 sm:rounded-xl overflow-hidden">
              <LiveTradeTicker tokenMint={profile.creator_coin_mint} />
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex items-center gap-1 mb-6 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
            {[
              { id: 'grid', label: 'Posts', icon: Squares2X2Icon },
              { id: 'tokens', label: 'Tokens', icon: CurrencyDollarIcon },
              { id: 'wallet', label: 'Wallet', icon: WalletIcon },
              { id: 'activity', label: 'Activity', icon: SparklesIcon },
              ...(isOwnProfile ? [{ id: 'analytics', label: 'Analytics', icon: ChartBarIcon }] : []),
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as typeof activeTab)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all whitespace-nowrap',
                  activeTab === id
                    ? 'bg-neon-lime text-black shadow-glow-lime'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="min-h-[400px]">
            {activeTab === 'grid' && (
              <PostGrid
                posts={posts}
                loading={postsLoading}
                emptyMessage={isOwnProfile ? 'Create your first post to get started!' : `${profile.display_name} hasn't posted yet`}
                onEmpty={isOwnProfile ? () => router.push('/create') : undefined}
              />
            )}

            {activeTab === 'tokens' && (
              <TokensTab userId={profile.id} />
            )}

            {activeTab === 'wallet' && (
              <WalletTab userId={profile.id} walletAddress={profile.wallet_address} />
            )}

            {activeTab === 'collected' && (
              <CollectedTab userId={profile.id} walletAddress={profile.wallet_address} />
            )}

            {activeTab === 'activity' && (
              <ActivityTab userId={profile.id} walletAddress={profile.wallet_address} />
            )}

            {activeTab === 'analytics' && isOwnProfile && (
              <AnalyticsDashboard userId={profile.id} walletAddress={profile.wallet_address} />
            )}
          </div>
        </div>
      </div>

      {/* Creator Coin Activation Modal */}
      {profile && isOwnProfile && (
        <ActivateCreatorCoinModal
          isOpen={showActivateCoinModal}
          onClose={() => setShowActivateCoinModal(false)}
          onSuccess={() => {
            setShowActivateCoinModal(false);
            loadUserProfile();
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

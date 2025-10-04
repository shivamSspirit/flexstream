'use client';

import { useState, useEffect, Suspense } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MagnifyingGlassIcon,
  UserIcon, 
  HomeIcon,
  MapIcon,
  PlusIcon,
  BellIcon,
  CogIcon,
  BookmarkIcon,
  PencilIcon, 
  ArrowTrendingUpIcon,
  PaperAirplaneIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  Squares2X2Icon,
  CheckBadgeIcon,
  ClipboardDocumentIcon,
  TrophyIcon,
  FireIcon,
  SparklesIcon,
  PlayIcon,
  ClockIcon,
  StarIcon,
  GiftIcon,
  QrCodeIcon,
  UserPlusIcon,
  ChatBubbleLeftIcon
} from '@heroicons/react/24/outline';
import { 
  XMarkIcon as XIcon
} from '@heroicons/react/24/solid';
import { supabase } from '@/lib/supabase';
import { User, FlexPost } from '@/types';

function ProfilePageContent() {
  const { publicKey, connected } = useWallet();
  const router = useRouter();
  const searchParams = useSearchParams();
  const ts = searchParams?.get('ts') || '';
  const [profile, setProfile] = useState<User | null>(null);
  const [posts, setPosts] = useState<FlexPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (connected && publicKey) {
      console.log('[Profile] useEffect triggered, ts:', ts);
      fetchProfile(publicKey.toBase58());
    } else if (!connected) {
      setLoading(false);
    }
  }, [connected, publicKey, ts]);

  const copyWalletAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toBase58());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const fetchProfile = async (address: string) => {
    try {
      setLoading(true);
      console.log('[Profile] Fetch start for', address);
      
      // Force fresh fetch from database (no cache)
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', address)
        .single();

      let effectiveProfile = profileData as any | null;

      if (profileError || !profileData) {
        console.warn('[Profile] Not found, attempting create:', profileError);
        // Attempt to create a default profile
        const defaultUsername = `user_${address.slice(0, 6)}`;
        const defaultDisplay = `User ${address.slice(0, 4)}...${address.slice(-4)}`;
        const { data: created, error: createErr } = await supabase
          .from('users')
          .insert({
            wallet_address: address,
            username: defaultUsername,
            display_name: defaultDisplay,
          })
          .select('*')
          .single();

        if (createErr) {
          console.error('[Profile] Create failed, using local fallback:', createErr);
          // Fallback: synthesize a local profile so UI still loads
          effectiveProfile = {
            id: `local_${address}`,
            wallet_address: address,
            username: defaultUsername,
            display_name: defaultDisplay,
            avatar_url: null,
            followers_count: 0,
            following_count: 0,
          } as any;
          setProfile(effectiveProfile);
          setPosts([]);
          return;
        }
        effectiveProfile = created as any;
      }

      console.log('[Profile] Loaded profile:', {
        id: effectiveProfile?.id,
        avatar_url: effectiveProfile?.avatar_url,
        display_name: effectiveProfile?.display_name,
        updated_at: effectiveProfile?.updated_at
      });
      
      setProfile(effectiveProfile);

      // Fetch user's posts using the database user id (skip if synthesized local id)
      if (String(effectiveProfile.id).startsWith('local_')) {
        setPosts([]);
        return;
      }

      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', effectiveProfile.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (postsError) {
        console.error('[Profile] Posts fetch error:', postsError);
      } else {
        setPosts(postsData || []);
      }
    } catch (error) {
      console.error('[Profile] Unexpected error:', error);
      // Last-resort fallback UI
      if (publicKey) {
        const address = publicKey.toBase58();
        const defaultUsername = `user_${address.slice(0, 6)}`;
        const defaultDisplay = `User ${address.slice(0, 4)}...${address.slice(-4)}`;
        setProfile({
          id: `local_${address}`,
          wallet_address: address,
          username: defaultUsername,
          display_name: defaultDisplay,
        } as any);
        setPosts([]);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading your profile...</div>
      </div>
    );
  }

  if (!connected || !publicKey) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-4">Connect your wallet to view profile</div>
          <Button onClick={() => router.push('/') } className="bg-green-600 hover:bg-green-700 text-white">
            Go to Get Started
          </Button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-4">Profile not found for {publicKey.toBase58().slice(0,4)}...{publicKey.toBase58().slice(-4)}</div>
          <Button onClick={() => router.push('/settings')} className="bg-green-600 hover:bg-green-700 text-white">
            Complete Setup
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex">
      {/* Left Sidebar */}
      <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">★</span>
            </div>
            <span className="text-white font-bold text-xl">FlexStream</span>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => router.push('/')}
            className="w-full flex items-center space-x-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <HomeIcon className="w-5 h-5" />
            <span>Newsfeed</span>
          </button>
          
          <button 
            onClick={() => router.push('/profile')}
            className="w-full flex items-center space-x-3 px-4 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <UserIcon className="w-5 h-5" />
            <span>Profile</span>
          </button>
          
          <button 
            onClick={() => router.push('/settings')}
            className="w-full flex items-center space-x-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <CogIcon className="w-5 h-5" />
            <span>Settings</span>
          </button>
        </div>
      </div>
              
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <div className="bg-black border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <h1 className="text-white text-lg font-semibold">Profile</h1>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for posts, creators, or to"
                className="bg-gray-800 text-white placeholder-gray-400 px-4 py-2 pl-10 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
            </div>
            <Button className="bg-gray-800 text-white hover:bg-gray-700">
              <MagnifyingGlassIcon className="w-4 h-4 mr-2" />
              Search
            </Button>
            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="flex-1 bg-black overflow-y-auto">
          <div className="max-w-5xl mx-auto">
            {/* Banner Image */}
            <div className="relative h-64 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600">
              {profile.banner_url ? (
                <img
                  src={profile.banner_url}
                  alt="Banner"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <SparklesIcon className="w-20 h-20 text-white opacity-20" />
                </div>
              )}
            </div>

            <div className="px-6 pb-6">
              {/* Profile Header Section */}
              <div className="relative -mt-16 mb-6">
                <div className="flex items-end justify-between">
                  {/* Avatar */}
                  <div className="relative">
                    <img
                      key={profile.avatar_url || 'default-avatar'}
                      src={profile.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'}
                      alt="Profile"
                      className="w-32 h-32 rounded-full border-4 border-black bg-gray-800 object-cover"
                      onError={(e) => {
                        console.error('[Profile Avatar] Failed to load:', profile.avatar_url);
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face';
                      }}
                      onLoad={() => {
                        console.log('[Profile Avatar] Successfully loaded:', profile.avatar_url);
                      }}
                    />
                    {profile.verified && (
                      <div className="absolute bottom-2 right-2 bg-green-600 rounded-full p-1">
                        <CheckBadgeIcon className="w-6 h-6 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-3 mb-4">
                    <Button 
                      variant="outline" 
                      className="border-gray-600 text-white hover:bg-gray-800"
                      onClick={() => router.push('/settings')}
                    >
                      <PencilIcon className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                    <Button className="bg-green-600 hover:bg-green-700 text-white">
                      <UserPlusIcon className="w-4 h-4 mr-2" />
                      Follow
                    </Button>
                    <Button variant="outline" className="border-gray-600 text-white hover:bg-gray-800">
                      <ChatBubbleLeftIcon className="w-4 h-4 mr-2" />
                      Message
                    </Button>
                  </div>
                </div>

                {/* Name and Username */}
                <div className="mt-4">
                  <div className="flex items-center space-x-2 mb-1">
                    <h1 className="text-white font-bold text-3xl">
                      {profile.display_name || profile.username || 'User'}
                    </h1>
                    {profile.verified && (
                      <CheckBadgeIcon className="w-7 h-7 text-green-500" />
                    )}
                  </div>
                  <p className="text-gray-400 text-lg">@{profile.username || 'anonymous'}</p>
                  
                  {/* Wallet Address with Copy */}
                  <div className="flex items-center space-x-2 mt-2">
                    <code className="text-gray-500 text-sm font-mono">
                      {publicKey.toBase58().slice(0, 8)}...{publicKey.toBase58().slice(-8)}
                    </code>
                    <button
                      onClick={copyWalletAddress}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {copied ? (
                        <span className="text-green-500 text-xs">Copied!</span>
                      ) : (
                        <ClipboardDocumentIcon className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Bio */}
                {profile.bio && (
                  <p className="text-gray-300 mt-4 text-base max-w-2xl">
                    {profile.bio}
                  </p>
                )}

                {/* Social Links */}
                <div className="flex items-center space-x-4 mt-4">
                  {profile.twitter_handle && (
                    <a
                      href={`https://twitter.com/${profile.twitter_handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <XIcon className="w-5 h-5" />
                    </a>
                  )}
                  {profile.discord_handle && (
                    <span className="text-gray-400 text-sm">
                      Discord: {profile.discord_handle}
                    </span>
                  )}
                  {profile.youtube_channel && (
                    <a
                      href={profile.youtube_channel}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-red-500 transition-colors text-sm"
                    >
                      YouTube
                    </a>
                  )}
                  {profile.telegram_handle && (
                    <span className="text-gray-400 text-sm">
                      Telegram: {profile.telegram_handle}
                    </span>
                  )}
                  {profile.website_url && (
                    <a
                      href={profile.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-white transition-colors text-sm"
                    >
                      🌐 Website
                    </a>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center space-x-8 mt-6">
                  <div className="text-center">
                    <div className="text-white font-bold text-xl">{posts.length}</div>
                    <div className="text-gray-400 text-sm">Posts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white font-bold text-xl">{profile.followers_count || profile.total_followers || 0}</div>
                    <div className="text-gray-400 text-sm">Followers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white font-bold text-xl">{profile.following_count || profile.total_following || 0}</div>
                    <div className="text-gray-400 text-sm">Following</div>
                  </div>
                  <div className="text-center">
                    <div className="text-green-400 font-bold text-xl">
                      ${(profile.verified_earnings || 0).toLocaleString()}
                    </div>
                    <div className="text-gray-400 text-sm">Verified Earnings</div>
                  </div>
                </div>

                {/* Achievements/Badges */}
                <div className="mt-6 flex items-center space-x-3">
                  <span className="text-gray-400 text-sm font-medium">Achievements:</span>
                  <div className="flex items-center space-x-2">
                    {profile.success_tier === 'diamond' && (
                      <Badge className="bg-blue-600 text-white flex items-center space-x-1">
                        <TrophyIcon className="w-3 h-3" />
                        <span>Diamond Trader</span>
                      </Badge>
                    )}
                    {profile.success_tier === 'gold' && (
                      <Badge className="bg-yellow-600 text-white flex items-center space-x-1">
                        <TrophyIcon className="w-3 h-3" />
                        <span>Gold Trader</span>
                      </Badge>
                    )}
                    {profile.success_tier === 'silver' && (
                      <Badge className="bg-gray-400 text-white flex items-center space-x-1">
                        <TrophyIcon className="w-3 h-3" />
                        <span>Silver Trader</span>
                      </Badge>
                    )}
                    {(!profile.success_tier || profile.success_tier === 'bronze') && (
                      <Badge className="bg-orange-600 text-white flex items-center space-x-1">
                        <TrophyIcon className="w-3 h-3" />
                        <span>Bronze Trader</span>
                      </Badge>
                    )}
                    <Badge className="bg-purple-600 text-white flex items-center space-x-1">
                      <FireIcon className="w-3 h-3" />
                      <span>Pump.fun Verified</span>
                    </Badge>
                    <Badge className="bg-green-600 text-white flex items-center space-x-1">
                      <StarIcon className="w-3 h-3" />
                      <span>Early Adopter</span>
                    </Badge>
                  </div>
                </div>

                {/* Monetization Actions */}
                <div className="mt-6 flex items-center space-x-3">
                  <Button variant="outline" className="border-green-600 text-green-500 hover:bg-green-600 hover:text-white">
                    <GiftIcon className="w-4 h-4 mr-2" />
                    Send Tip
                  </Button>
                  <Button variant="outline" className="border-gray-600 text-white hover:bg-gray-800">
                    <QrCodeIcon className="w-4 h-4 mr-2" />
                    Show QR
                  </Button>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-800 mb-6">
                <div className="flex space-x-8">
                  <button 
                    onClick={() => setActiveTab('posts')}
                    className={`pb-3 px-2 border-b-2 transition-colors ${
                      activeTab === 'posts'
                        ? 'border-green-500 text-green-500'
                        : 'border-transparent text-gray-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Squares2X2Icon className="w-4 h-4" />
                      <span className="font-medium">Posts</span>
                    </div>
                  </button>
                  <button 
                    onClick={() => setActiveTab('streams')}
                    className={`pb-3 px-2 border-b-2 transition-colors ${
                      activeTab === 'streams'
                        ? 'border-green-500 text-green-500'
                        : 'border-transparent text-gray-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <PlayIcon className="w-4 h-4" />
                      <span className="font-medium">Streams</span>
                    </div>
                  </button>
                  <button 
                    onClick={() => setActiveTab('holdings')}
                    className={`pb-3 px-2 border-b-2 transition-colors ${
                      activeTab === 'holdings'
                        ? 'border-green-500 text-green-500'
                        : 'border-transparent text-gray-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <BriefcaseIcon className="w-4 h-4" />
                      <span className="font-medium">Holdings</span>
                    </div>
                  </button>
                  <button 
                    onClick={() => setActiveTab('activity')}
                    className={`pb-3 px-2 border-b-2 transition-colors ${
                      activeTab === 'activity'
                        ? 'border-green-500 text-green-500'
                        : 'border-transparent text-gray-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <ClockIcon className="w-4 h-4" />
                      <span className="font-medium">Activity</span>
                    </div>
                  </button>
                  <button 
                    onClick={() => setActiveTab('pinned')}
                    className={`pb-3 px-2 border-b-2 transition-colors ${
                      activeTab === 'pinned'
                        ? 'border-green-500 text-green-500'
                        : 'border-transparent text-gray-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <BookmarkIcon className="w-4 h-4" />
                      <span className="font-medium">Pinned</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              {activeTab === 'posts' && (
                <div className="space-y-4">
                  {posts.length === 0 ? (
                    <div className="text-center py-12 bg-gray-900 rounded-lg">
                      <Squares2X2Icon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400">No posts yet</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {posts.map((post) => (
                        <div key={post.id} className="bg-gray-900 rounded-lg overflow-hidden hover:ring-2 hover:ring-green-500 transition-all cursor-pointer">
                          {post.media_urls && post.media_urls.length > 0 && (
                            <img
                              src={post.media_urls[0]}
                              alt={post.title || 'Post'}
                              className="w-full h-48 object-cover"
                            />
                          )}
                          <div className="p-4">
                            <h3 className="text-white font-medium mb-2 line-clamp-2">
                              {post.title || (post.content ? post.content : 'Post')}
                            </h3>
                            <div className="flex items-center justify-between text-sm text-gray-400">
                              <span>{new Date(post.created_at).toLocaleDateString()}</span>
                              {post.earnings_amount && (
                                <span className="text-green-400 font-semibold">
                                  ${post.earnings_amount.toLocaleString()}
                                </span>
                              )}
                            </div>
                            {post.verified && (
                              <Badge className="bg-green-600 text-white mt-2">
                                <CheckBadgeIcon className="w-3 h-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'streams' && (
                <div className="text-center py-16 bg-gray-900 rounded-lg">
                  <PlayIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-white font-medium text-lg mb-2">Live Streams Coming Soon</h3>
                  <p className="text-gray-400">Watch and share your Pump.fun trading streams</p>
                </div>
              )}

              {activeTab === 'holdings' && (
                <div className="text-center py-16 bg-gray-900 rounded-lg">
                  <BriefcaseIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-white font-medium text-lg mb-2">Token Holdings</h3>
                  <p className="text-gray-400">Your Solana token portfolio will appear here</p>
                </div>
              )}
              
              {activeTab === 'activity' && (
                <div className="text-center py-16 bg-gray-900 rounded-lg">
                  <ClockIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-white font-medium text-lg mb-2">Trading Activity</h3>
                  <p className="text-gray-400">Your trade history and activity feed</p>
                </div>
              )}

              {activeTab === 'pinned' && (
                <div className="text-center py-16 bg-gray-900 rounded-lg">
                  <BookmarkIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-white font-medium text-lg mb-2">Pinned Highlights</h3>
                  <p className="text-gray-400">Pin your best trades and moments</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProfilePageContent />
    </Suspense>
  );
}
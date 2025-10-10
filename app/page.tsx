'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  HeartIcon, 
  ChatBubbleLeftIcon, 
  ShareIcon,
  PlusIcon,
  PlayIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';

export default function HomePage() {
  const router = useRouter();
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [displayedItems, setDisplayedItems] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const observerTarget = useRef(null);

  const feedItems = [
    {
      id: '1',
      type: 'mint',
      user: {
        avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop',
        name: 'Alex Morrison',
        username: 'alexm',
        verified: true
      },
      action: 'minted',
      content: {
        title: 'Cosmic Dreams #127',
        media: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=800&h=800&fit=crop',
        mediaType: 'image'
      },
      price: '2.5 SOL',
      priceUsd: '$285.00',
      holders: 127,
      likes: 342,
      comments: 28,
      time: '2h ago',
      edition: '1 of 100',
      hasVideo: false
    },
    {
      id: '2',
      type: 'buy',
      user: {
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
        name: 'Sarah Chen',
        username: 'sarahc',
        verified: true
      },
      action: 'bought',
      content: {
        title: 'Digital Sunset Series',
        media: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=800&fit=crop',
        mediaType: 'image'
      },
      price: '0.8 SOL',
      priceUsd: '$91.20',
      priceChange: '+15.2%',
      holders: 284,
      likes: 891,
      comments: 156,
      time: '4h ago',
      edition: '12 of 50',
      hasVideo: false
    },
    {
      id: '3',
      type: 'video',
      user: {
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop',
        name: 'Marcus Johnson',
        username: 'marcusj',
        verified: true
      },
      action: 'shared',
      content: {
        title: 'Motion Study 003',
        media: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&h=800&fit=crop',
        mediaType: 'video'
      },
      price: 'Free Mint',
      priceUsd: '',
      holders: 1847,
      likes: 1247,
      comments: 89,
      time: '6h ago',
      edition: 'Open Edition',
      hasVideo: true
    },
    {
      id: '4',
      type: 'mint',
      user: {
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop',
        name: 'Emma Williams',
        username: 'emmaw',
        verified: false
      },
      action: 'minted',
      content: {
        title: 'Abstract Flow #42',
        media: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=800&h=800&fit=crop',
        mediaType: 'image'
      },
      price: '1.2 SOL',
      priceUsd: '$136.80',
      holders: 45,
      likes: 523,
      comments: 67,
      time: '8h ago',
      edition: '42 of 100',
      hasVideo: false
    },
    {
      id: '5',
      type: 'buy',
      user: {
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
        name: 'David Park',
        username: 'davidp',
        verified: true
      },
      action: 'collected',
      content: {
        title: 'Neon Dreams Collection',
        media: 'https://images.unsplash.com/photo-1605792657660-596af9009e82?w=800&h=800&fit=crop',
        mediaType: 'image'
      },
      price: '3.5 SOL',
      priceUsd: '$399.00',
      priceChange: '+45.8%',
      holders: 312,
      likes: 2156,
      comments: 342,
      time: '10h ago',
      edition: '7 of 25',
      hasVideo: false
    }
  ];

  // Infinite scroll logic
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading && displayedItems < feedItems.length * 3) {
          setIsLoading(true);
          setTimeout(() => {
            setDisplayedItems((prev) => Math.min(prev + 3, feedItems.length * 3));
            setIsLoading(false);
          }, 1000);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [isLoading, displayedItems, feedItems.length]);

  const toggleLike = (postId: string) => {
    setLikedPosts(prev => {
      const newLikes = new Set(prev);
      if (newLikes.has(postId)) {
        newLikes.delete(postId);
      } else {
        newLikes.add(postId);
      }
      return newLikes;
    });
  };

  // Generate repeated feed items for infinite scroll
  const infiniteFeedItems = Array.from({ length: displayedItems }, (_, i) => {
    const baseItem = feedItems[i % feedItems.length];
    return {
      ...baseItem,
      id: `${baseItem.id}-${Math.floor(i / feedItems.length)}-${i}`
    };
  });

  const suggestedFollows = [
    {
      id: '1',
      name: 'Alex Morrison',
      username: 'alexm',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop',
      bio: 'Digital artist & NFT creator',
      followers: '125K',
      verified: true
    },
    {
      id: '2',
      name: 'Sarah Chen',
      username: 'sarahc',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
      bio: 'Crypto enthusiast',
      followers: '98K',
      verified: true
    },
    {
      id: '3',
      name: 'Marcus Johnson',
      username: 'marcusj',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop',
      bio: 'Web3 developer',
      followers: '87K',
      verified: true
    },
    {
      id: '4',
      name: 'Emma Williams',
      username: 'emmaw',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop',
      bio: 'NFT collector',
      followers: '76K',
      verified: false
    },
  ];

    return (
    <AppLayout showWallet={true} showSearch={true}>
      <div className="min-h-screen pb-20 md:pb-0">
        {/* Main Container - Zora Exact Layout */}
        <div className="max-w-[1400px] mx-auto flex justify-center gap-8 px-4">
          {/* Feed Container - Centered */}
          <div className="w-full max-w-[600px]">
            {/* Feed Items */}
            <div className="space-y-0 md:space-y-6 -mx-4 sm:mx-0">
            {infiniteFeedItems.map((item, index) => (
              <article
                key={item.id}
                onClick={() => router.push(`/post/${item.id}`)}
                className="bg-app-bg md:bg-card-bg md:rounded-2xl overflow-hidden md:border md:border-white/5 md:hover:border-white/10 transition-all duration-200 cursor-pointer"
              >
                {/* User Header - Compact Zora Style */}
                <div 
                  className="px-4 pt-3 pb-2 flex items-center justify-between"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-2.5">
                    <Avatar 
                      className="h-10 w-10 ring-2 ring-white/10 cursor-pointer hover:ring-white/20 transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/profile/${item.user.username}`);
                      }}
                    >
                      <AvatarImage src={item.user.avatar} alt={item.user.name} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white font-semibold text-sm">
                        {item.user.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span 
                          className="text-primary text-sm font-semibold hover:text-purple-400 transition-colors cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/profile/${item.user.username}`);
                          }}
                        >
                          {item.user.name}
                        </span>
                        {item.user.verified && (
                          <div className="w-4 h-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-[10px] font-bold">✓</span>
                </div>
                        )}
            </div>
                      <p className="text-secondary text-xs">
                        {item.action} · {item.time}
                      </p>
          </div>
                  </div>
                </div>

                {/* Media - Full Width on Mobile */}
                <div className="relative group cursor-pointer bg-black">
                  <img
                    src={item.content.media}
                    alt={item.content.title}
                    className="w-full aspect-square object-cover"
                  />
                  {item.hasVideo && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                      <div className="w-16 h-16 bg-white/95 hover:bg-white rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xl">
                        <PlayIcon className="w-8 h-8 text-gray-900 ml-1" />
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                  {/* Content Info - Zora Style */}
                <div className="px-4 pt-2 pb-3" onClick={(e) => e.stopPropagation()}>
                  <h2 className="text-primary text-base font-semibold mb-1 hover:text-purple-400 transition-colors cursor-pointer">
                    {item.content.title}
                  </h2>
                  <p className="text-secondary text-xs mb-2">{item.edition}</p>

                  {/* Price & Action Row */}
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold text-primary">
                          {item.price}
                        </span>
                        {item.priceUsd && (
                          <span className="text-secondary text-xs">{item.priceUsd}</span>
                        )}
                      </div>
                      {item.holders > 0 && (
                        <p className="text-secondary text-xs">
                          {item.holders} collectors
                        </p>
                      )}
                    </div>
                    {item.type !== 'video' && (
                      <Button 
                        className="flexstream-gradient text-white px-6 py-2 text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Collect clicked for:', item.content.title);
                        }}
                      >
                        Collect
                      </Button>
                    )}
                </div>

                  {/* Actions - Minimal Zora Style */}
                  <div className="flex items-center gap-6 pt-2 border-t border-white/5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLike(item.id);
                      }}
                      className={cn(
                        "flex items-center gap-1.5 transition-all group",
                        likedPosts.has(item.id) ? "text-pink-500" : "text-secondary hover:text-pink-400"
                      )}
                    >
                      {likedPosts.has(item.id) ? (
                        <HeartSolidIcon className="w-5 h-5" />
                      ) : (
                        <HeartIcon className="w-5 h-5 group-hover:scale-105 transition-transform" />
                      )}
                      <span className="text-xs font-medium">
                        {likedPosts.has(item.id) ? item.likes + 1 : item.likes}
                      </span>
                    </button>
                    <button className="flex items-center gap-1.5 text-secondary hover:text-blue-400 transition-colors group">
                      <ChatBubbleLeftIcon className="w-5 h-5 group-hover:scale-105 transition-transform" />
                      <span className="text-xs font-medium">{item.comments}</span>
                    </button>
                    <button className="flex items-center gap-1.5 text-secondary hover:text-green-400 transition-colors group">
                      <ShareIcon className="w-5 h-5 group-hover:scale-105 transition-transform" />
                    </button>
                  </div>
                </div>
              </article>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex justify-center py-8">
                <div className="flex flex-col items-center gap-3">
                  <div className="flex gap-2">
                    <div className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2.5 h-2.5 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            
            {/* Observer target for infinite scroll */}
            <div ref={observerTarget} className="h-20" />
          </div>
        </div>

          {/* Right Sidebar - Suggested Follows (Desktop Only, Zora Style) */}
          <aside className="hidden lg:block w-80 sticky top-24 h-fit">
            {/* Suggested Follows - Ultra Compact */}
            <div className="bg-card-bg rounded-xl p-4 border border-white/5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-primary font-semibold text-sm">Suggested</h3>
                <button 
                  className="text-purple-400 text-xs hover:text-purple-300"
                  onClick={() => router.push('/discover')}
                >
                  See all
                </button>
              </div>

              <div className="space-y-3">
                {suggestedFollows.slice(0, 3).map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 group"
                  >
                    <Avatar 
                      className="h-10 w-10 ring-1 ring-white/10 group-hover:ring-white/20 transition-all cursor-pointer flex-shrink-0"
                      onClick={() => router.push(`/profile/${user.username}`)}
                    >
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white font-semibold text-sm">
                        {user.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <button
                          onClick={() => router.push(`/profile/${user.username}`)}
                          className="text-primary font-semibold text-sm truncate group-hover:text-purple-400 transition-colors"
                        >
                          {user.name}
                        </button>
                        {user.verified && (
                          <div className="w-3.5 h-3.5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-[9px] font-bold">✓</span>
                          </div>
                        )}
                      </div>
                      <p className="text-secondary text-xs">{user.followers} followers</p>
                    </div>

                    <Button 
                      size="sm" 
                      className="bg-white/5 hover:bg-white/10 text-primary border border-white/10 px-4 py-1.5 text-xs h-8 rounded-lg transition-colors flex-shrink-0 font-medium"
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('Follow:', user.username);
                      }}
                    >
                      Follow
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>

        {/* Floating Action Button - Zora Style */}
        <button
          onClick={() => router.push('/create')}
          className="fixed bottom-24 md:bottom-8 right-4 md:right-8 w-14 h-14 md:w-16 md:h-16 flexstream-gradient rounded-full flex items-center justify-center shadow-2xl shadow-purple-500/50 hover:scale-110 transition-transform z-40"
          aria-label="Create"
        >
          <PlusIcon className="w-7 h-7 md:w-8 md:h-8 text-white stroke-[2.5]" />
        </button>
      </div>
    </AppLayout>
  );
}

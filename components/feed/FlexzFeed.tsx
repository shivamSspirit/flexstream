'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePosts, Post } from '@/hooks/usePosts';
import { TokenPriceDisplay } from '@/components/price/TokenPriceDisplay';
import { cn } from '@/lib/utils';

interface FlexzCardProps {
  post: Post;
}

// Single Flex Card - Instagram Reels style but in a feed layout
function FlexzCard({ post }: FlexzCardProps) {
  const router = useRouter();
  const [showHeart, setShowHeart] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [saved, setSaved] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastTapRef = useRef<number>(0);
  const cardRef = useRef<HTMLDivElement>(null);

  // Intersection observer to auto-play/pause video when in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsPlaying(true);
            videoRef.current?.play().catch(() => {});
          } else {
            setIsPlaying(false);
            if (videoRef.current) {
              videoRef.current.pause();
            }
          }
        });
      },
      { threshold: 0.6 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Double tap to show heart animation
  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 1000);
    }
    lastTapRef.current = now;
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };

  const mediaUrl = post.media_urls?.[0] || 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=600&h=1200&fit=crop';
  const isVideo = mediaUrl.includes('.mp4') || mediaUrl.includes('.webm') || mediaUrl.includes('.mov');
  const commentCount = Math.floor(Math.random() * 5000) + 100;
  const shareCount = Math.floor(Math.random() * 2000) + 50;

  const formatCount = (num: number) => {
    if (num >= 1000000) return `${(num/1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num/1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div
      ref={cardRef}
      className="relative w-full bg-black rounded-2xl overflow-hidden"
      style={{ aspectRatio: '9/16', maxHeight: '85vh' }}
      onClick={handleDoubleTap}
    >
      {/* Full Media */}
      <div className="absolute inset-0">
        {isVideo ? (
          <video
            ref={videoRef}
            src={mediaUrl}
            className="w-full h-full object-cover"
            loop
            muted={isMuted}
            playsInline
          />
        ) : (
          <img src={mediaUrl} alt="" className="w-full h-full object-cover" />
        )}

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent via-30% to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 via-50% to-transparent pointer-events-none" />
      </div>

      {/* Double tap heart animation */}
      {showHeart && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
          <div className="animate-heart-burst">
            <svg className="w-24 h-24 text-white drop-shadow-2xl" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
            </svg>
          </div>
        </div>
      )}

      {/* RIGHT SIDE ACTIONS - Instagram Reels style */}
      <div className="absolute right-2 sm:right-3 bottom-[160px] sm:bottom-[180px] flex flex-col items-center z-10 gap-4 sm:gap-5">

        {/* Profile Avatar + Follow */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/profile/${post.users?.username}`);
            }}
            className="block"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 sm:border-[2.5px] border-white overflow-hidden shadow-2xl">
              <img
                src={post.users?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.users?.username}`}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          </button>
          {!isFollowing && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsFollowing(true);
              }}
              className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-[#FE2C55] flex items-center justify-center shadow-xl"
            >
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
          )}
        </div>

        {/* Market Cap */}
        <div className="flex flex-col items-center">
          {post.token_mint ? (
            <TokenPriceDisplay
              mint={post.token_mint}
              showChange={false}
              size="sm"
              variant="vertical"
            />
          ) : (
            <>
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-r from-[#9945FF] to-[#14F195] flex items-center justify-center">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/>
                </svg>
              </div>
              <span className="text-white text-[10px] sm:text-[11px] font-bold mt-0.5 sm:mt-1 drop-shadow-lg">$--</span>
            </>
          )}
        </div>

        {/* Comment */}
        <button
          onClick={(e) => { e.stopPropagation(); router.push(`/post/${post.id}`); }}
          className="flex flex-col items-center"
        >
          <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
            <path d="M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.403 4.403 0 00-1.032-.211 50.89 50.89 0 00-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 002.433 3.984L7.28 21.53A.75.75 0 016 21v-4.03a48.527 48.527 0 01-1.087-.128C2.905 16.58 1.5 14.833 1.5 12.862V6.638c0-1.97 1.405-3.718 3.413-3.979z" />
            <path d="M15.75 7.5c-1.376 0-2.739.057-4.086.169C10.124 7.797 9 9.103 9 10.609v4.285c0 1.507 1.128 2.814 2.67 2.94 1.243.102 2.5.157 3.768.165l2.782 2.781a.75.75 0 001.28-.53v-2.39l.33-.026c1.542-.125 2.67-1.433 2.67-2.94v-4.286c0-1.505-1.125-2.811-2.664-2.94A49.392 49.392 0 0015.75 7.5z" />
          </svg>
          <span className="text-white text-[10px] sm:text-[11px] font-bold mt-0.5 sm:mt-1 drop-shadow-lg">{formatCount(commentCount)}</span>
        </button>

        {/* Share */}
        <button onClick={(e) => e.stopPropagation()} className="flex flex-col items-center">
          <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" d="M15.75 4.5a3 3 0 11.825 2.066l-8.421 4.679a3.002 3.002 0 010 1.51l8.421 4.679a3 3 0 11-.729 1.31l-8.421-4.678a3 3 0 110-4.132l8.421-4.679a3 3 0 01-.096-.755z" clipRule="evenodd" />
          </svg>
          <span className="text-white text-[10px] sm:text-[11px] font-bold mt-0.5 sm:mt-1 drop-shadow-lg">{formatCount(shareCount)}</span>
        </button>

        {/* Save/Bookmark */}
        <button onClick={(e) => { e.stopPropagation(); setSaved(!saved); }} className="flex flex-col items-center">
          {saved ? (
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#FFD700] drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        {/* Spinning Music Disc */}
        <div className={cn(
          "w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white/30 overflow-hidden shadow-xl mt-0.5 sm:mt-1",
          isPlaying && "animate-spin-slow"
        )}>
          <img
            src={post.media_urls?.[0] || 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=100&h=100&fit=crop'}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* BOTTOM CONTENT */}
      <div className="absolute left-3 right-16 bottom-4 z-10">

        {/* Username Row */}
        <div className="flex items-center gap-2 mb-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/profile/${post.users?.username}`);
            }}
            className="flex items-center gap-1.5"
          >
            <span className="text-white font-bold text-[15px] drop-shadow-lg">
              @{post.users?.username || 'anonymous'}
            </span>
            {post.verified && (
              <svg className="w-3.5 h-3.5 text-[#20D5EC]" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
              </svg>
            )}
          </button>
          {!isFollowing && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsFollowing(true);
              }}
              className="text-white/70 text-[13px] font-semibold"
            >
              · Follow
            </button>
          )}
        </div>

        {/* Caption */}
        <p className="text-white text-[13px] leading-[18px] mb-2 line-clamp-2 drop-shadow-lg">
          {post.title}
          {post.content && <span className="text-white/70"> {post.content}</span>}
        </p>

        {/* Token Tag + Buy */}
        {post.token_mint && (
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md">
              <div className="w-4 h-4 rounded-full bg-gradient-to-r from-[#9945FF] to-[#14F195]" />
              <span className="text-white text-[12px] font-bold">$TOKEN</span>
              <span className="text-[#14F195] text-[11px] font-semibold">+12.5%</span>
            </div>
            <button
              onClick={(e) => e.stopPropagation()}
              className="px-4 py-1.5 rounded-full bg-[#14F195] text-black text-[12px] font-bold active:scale-95 transition-transform"
            >
              Buy
            </button>
          </div>
        )}

        {/* Music Row */}
        <div className="flex items-center gap-1.5">
          <svg className="w-3 h-3 text-white shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.952 1.651a.75.75 0 01.298.599V16.303a3 3 0 01-2.176 2.884l-1.32.377a2.553 2.553 0 11-1.403-4.909l2.311-.66a1.5 1.5 0 001.088-1.442V6.994l-9 2.572v9.737a3 3 0 01-2.176 2.884l-1.32.377a2.553 2.553 0 11-1.402-4.909l2.31-.66a1.5 1.5 0 001.088-1.442V5.25a.75.75 0 01.544-.721l10.5-3a.75.75 0 01.658.122z" />
          </svg>
          <p className="text-white text-[12px] truncate drop-shadow-lg">
            Original audio · @{post.users?.username || 'anonymous'}
          </p>
        </div>
      </div>

      {/* TOP CONTROLS - Mute button - positioned safely away from edges */}
      <div className="absolute top-4 right-4 sm:top-3 sm:right-3 z-10">
        <button
          onClick={toggleMute}
          className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/10"
        >
          {isMuted ? (
            <svg className="w-4.5 h-4.5 sm:w-4 sm:h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          ) : (
            <svg className="w-4.5 h-4.5 sm:w-4 sm:h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

export function FlexzFeed() {
  const { data, isLoading, error } = usePosts();
  const router = useRouter();

  const posts = data?.data?.posts || [];

  // Loading
  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 sm:gap-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="w-full bg-card-bg rounded-2xl animate-pulse" style={{ aspectRatio: '9/16', maxHeight: '70vh' }} />
        ))}
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <p className="text-white/70 text-base mb-3">Couldn&apos;t load Flexz</p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2 rounded-full bg-white text-black text-sm font-bold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Empty
  if (posts.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
            <svg className="w-8 h-8 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h3 className="text-white text-xl font-bold mb-2">No Flexz yet</h3>
          <p className="text-white/50 text-sm mb-5">Be the first to drop a Flex</p>
          <button
            onClick={() => router.push('/create')}
            className="px-6 py-2.5 rounded-full bg-accent-green text-black text-sm font-bold"
          >
            Create
          </button>
        </div>
      </div>
    );
  }

  // Feed - Vertical list of Reels cards
  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      {posts.map((post) => (
        <FlexzCard key={post.id} post={post} />
      ))}
    </div>
  );
}

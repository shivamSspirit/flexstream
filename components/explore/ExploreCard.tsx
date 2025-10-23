'use client';

import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export interface ExploreCardProps {
  id: string;
  image: string;
  title: string;
  creator: string;
  badge?: {
    label: string;
    variant: 'new' | 'hot' | 'trending';
  };
  stats: {
    currentPrice: string;
    floorPrice: string;
    holders: number;
  };
  timeAgo: string;
  actionLabel?: string;
  onAction?: () => void;
  href?: string;
}

const badgeStyles = {
  new: 'bg-blue-500 text-white',
  hot: 'bg-orange-500 text-white',
  trending: 'bg-purple-500 text-white',
};

export function ExploreCard({
  id,
  image,
  title,
  creator,
  badge,
  stats,
  timeAgo,
  actionLabel = 'View',
  onAction,
  href,
}: ExploreCardProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onAction) {
      onAction();
    } else if (href) {
      router.push(href);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <article
      className="bg-[#1a1a1a] rounded-xl overflow-hidden border border-white/[0.12] hover:border-white/25 cursor-pointer group transition-all shadow-lg hover:shadow-xl"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`View ${title} by ${creator}`}
    >
      {/* Image Container */}
      <div className="relative bg-black aspect-square overflow-hidden">
        <img
          src={image}
          alt={`${title} by ${creator}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Time Badge - Top Right */}
        <div className="absolute top-2 right-2">
          <span
            className="text-white text-[10px] bg-black/50 backdrop-blur-sm px-2 py-1 rounded-md font-medium"
            aria-label={`Posted ${timeAgo} ago`}
          >
            {timeAgo}
          </span>
        </div>

        {/* Badge - Top Left (Optional) */}
        {badge && (
          <div className="absolute top-2 left-2">
            <span
              className={cn(
                'text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wide',
                badgeStyles[badge.variant]
              )}
            >
              {badge.label}
            </span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-3">
        {/* Title & Creator */}
        <div className="mb-3">
          <h3 className="text-white text-sm font-semibold mb-1 truncate leading-tight">
            {title}
          </h3>
          <p className="text-white/50 text-[11px] truncate">{creator}</p>
        </div>

        {/* Stats Row */}
        <div className="flex items-end justify-between mb-3">
          <div className="flex flex-col gap-1">
            {/* Current Price with Icon */}
            <div className="flex items-center gap-1.5" aria-label={`Current price: ${stats.currentPrice}`}>
              <svg
                className="w-3 h-3 text-green-400"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-green-400 text-xs font-semibold">
                {stats.currentPrice}
              </span>
            </div>

            {/* Floor Price with Icon */}
            <div className="flex items-center gap-1.5" aria-label={`Floor price: ${stats.floorPrice}`}>
              <svg
                className="w-3 h-3 text-white/40"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-white/40 text-[10px] font-medium">
                {stats.floorPrice}
              </span>
            </div>
          </div>

          {/* Holders Count */}
          <div className="flex items-center gap-1.5" aria-label={`${stats.holders} holders`}>
            <svg
              className="w-3 h-3 text-white/40"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
            <span className="text-white/40 text-[10px] font-medium">
              {stats.holders}
            </span>
          </div>
        </div>

      </div>
    </article>
  );
}

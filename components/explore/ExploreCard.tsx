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
      className="bg-transparent cursor-pointer group transition-all hover:bg-white/5 rounded-xl"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`View ${title} by ${creator}`}
    >
      <div className="flex items-start gap-3 p-0">
        {/* Image Container - Square on LEFT */}
        <div className="relative bg-black w-28 h-28 overflow-hidden rounded-xl shrink-0">
          <img
            src={image}
            alt={`${title} by ${creator}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />

          {/* Badge - Top Left (Optional) */}
          {badge && (
            <div className="absolute top-2 left-2">
              <span
                className={cn(
                  'text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide',
                  badgeStyles[badge.variant]
                )}
              >
                {badge.label}
              </span>
            </div>
          )}
        </div>

        {/* Content Section - On RIGHT */}
        <div className="flex-1 min-w-0 py-1">
          {/* Title & Time on same row */}
          <div className="flex items-start justify-between mb-1">
            <h3 className="text-white text-sm font-semibold truncate leading-tight flex-1 pr-2">
              {title}
            </h3>
            <span className="text-white/40 text-xs shrink-0">{timeAgo}</span>
          </div>

          {/* Creator */}
          <p className="text-white/50 text-xs mb-3 truncate">{creator}</p>

          {/* Stats Row */}
          <div className="flex items-center gap-2.5">
            {/* Current Price with Triangle */}
            <div className="flex items-center gap-1" aria-label={`Current price: ${stats.currentPrice}`}>
              <svg className="w-2.5 h-2.5 text-green-400" viewBox="0 0 12 12" fill="currentColor">
                <path d="M6 2L11 10H1L6 2Z" />
              </svg>
              <span className="text-green-400 text-sm font-semibold">
                {stats.currentPrice}
              </span>
            </div>

            {/* Floor Price with Circle */}
            <div className="flex items-center gap-1" aria-label={`Floor price: ${stats.floorPrice}`}>
              <svg className="w-2.5 h-2.5 text-white/40" viewBox="0 0 12 12" fill="currentColor">
                <circle cx="6" cy="6" r="5" />
              </svg>
              <span className="text-white/40 text-xs font-medium">
                {stats.floorPrice}
              </span>
            </div>

            {/* Holders Count */}
            <div className="flex items-center gap-1" aria-label={`${stats.holders} holders`}>
              <svg
                className="w-3 h-3 text-white/40"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
              <span className="text-white/40 text-xs font-medium">
                {stats.holders}
              </span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

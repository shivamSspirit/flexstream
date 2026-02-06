'use client';

import { type FeedTabId, type SubFilter } from '@/components/feed/FeedTabs';

interface FilterOption {
  id: SubFilter;
  label: string;
}

const FILTERS: FilterOption[] = [
  { id: 'latest', label: 'Latest' },
  { id: 'hot', label: 'Hot' },
  { id: 'top_24h', label: 'Top 24h' },
  { id: 'top_7d', label: 'Top 7d' },
  { id: 'top_all', label: 'All Time' },
];

interface FeedSubFiltersProps {
  activeTab: FeedTabId;
  activeFilter: SubFilter;
  onFilterChange: (filter: SubFilter) => void;
}

export function FeedSubFilters({
  activeTab,
  activeFilter,
  onFilterChange,
}: FeedSubFiltersProps) {
  // Hide sub-filters on the predictions tab (it has its own filters)
  if (activeTab === 'predictions') return null;

  return (
    <div
      className="px-4 pb-2 flex gap-1.5 overflow-x-auto scrollbar-hide"
      style={{
        background: 'rgba(5, 5, 5, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {FILTERS.map((filter) => {
        const isActive = activeFilter === filter.id;
        return (
          <button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            className="px-3 py-1 rounded-full text-[10px] font-medium transition-all duration-150 whitespace-nowrap flex-shrink-0"
            style={{
              background: isActive ? 'rgba(224, 255, 98, 0.12)' : 'rgba(255,255,255,0.04)',
              color: isActive ? '#E0FF62' : 'rgba(255,255,255,0.4)',
              border: isActive
                ? '0.5px solid rgba(224, 255, 98, 0.25)'
                : '0.5px solid rgba(255,255,255,0.06)',
            }}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}

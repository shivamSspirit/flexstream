'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FunnelIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { PumpFunStreamFilter } from '@/types';

interface LiveStreamFiltersProps {
  filters: PumpFunStreamFilter;
  onFiltersChange: (filters: PumpFunStreamFilter) => void;
  sortBy: 'viewers' | 'market_cap' | 'volume' | 'price_change';
  onSortChange: (sortBy: 'viewers' | 'market_cap' | 'volume' | 'price_change') => void;
}

export function LiveStreamFilters({ 
  filters, 
  onFiltersChange, 
  sortBy, 
  onSortChange 
}: LiveStreamFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const sortOptions = [
    { value: 'viewers', label: 'Viewers', icon: '👥' },
    { value: 'market_cap', label: 'Market Cap', icon: '💰' },
    { value: 'volume', label: 'Volume', icon: '📊' },
    { value: 'price_change', label: 'Price Change', icon: '📈' },
  ] as const;

  const platformOptions = [
    { value: 'all', label: 'All Platforms' },
    { value: 'twitch', label: 'Twitch' },
    { value: 'youtube', label: 'YouTube' },
    { value: 'kick', label: 'Kick' },
    { value: 'other', label: 'Other' },
  ];

  const priceChangeOptions = [
    { value: 'all', label: 'All' },
    { value: 'up', label: 'Gaining' },
    { value: 'down', label: 'Losing' },
  ];

  const updateFilter = (key: keyof PumpFunStreamFilter, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value === 'all' || value === '' ? undefined : value,
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => value !== undefined && value !== null).length;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Card className="bg-white/5 backdrop-blur-md border-white/10">
      <CardContent className="p-4">
        {/* Filter Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <FunnelIcon className="w-5 h-5 text-gray-400" />
            <h3 className="text-white font-semibold">Filters & Sort</h3>
            {activeFiltersCount > 0 && (
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                {activeFiltersCount}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {activeFiltersCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="border-white/20 text-white hover:bg-white/10"
              >
                <XMarkIcon className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <AdjustmentsHorizontalIcon className="w-4 h-4 mr-1" />
              {isExpanded ? 'Less' : 'More'}
            </Button>
          </div>
        </div>

        {/* Sort Options */}
        <div className="mb-4">
          <label className="text-gray-400 text-sm mb-2 block">Sort by</label>
          <div className="flex flex-wrap gap-2">
            {sortOptions.map((option) => (
              <Button
                key={option.value}
                variant={sortBy === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => onSortChange(option.value)}
                className={
                  sortBy === option.value
                    ? "bg-purple-600 hover:bg-purple-700 text-white"
                    : "border-white/20 text-white hover:bg-white/10"
                }
              >
                <span className="mr-1">{option.icon}</span>
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Quick Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Platform Filter */}
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Platform</label>
            <select
              value={filters.platform || 'all'}
              onChange={(e) => updateFilter('platform', e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {platformOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Price Change Filter */}
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Price Change</label>
            <select
              value={filters.price_change_direction || 'all'}
              onChange={(e) => updateFilter('price_change_direction', e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {priceChangeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Verified Streamers */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="verified-only"
              checked={filters.verified_streamers_only || false}
              onChange={(e) => updateFilter('verified_streamers_only', e.target.checked)}
              className="w-4 h-4 text-purple-600 bg-white/10 border-white/20 rounded focus:ring-purple-500"
            />
            <label htmlFor="verified-only" className="text-gray-400 text-sm">
              Verified streamers only
            </label>
          </div>
        </div>

        {/* Advanced Filters */}
        {isExpanded && (
          <div className="space-y-4 pt-4 border-t border-white/10">
            <h4 className="text-white font-medium">Advanced Filters</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Min Viewers */}
              <div>
                <label className="text-gray-400 text-sm mb-2 block">Min Viewers</label>
                <input
                  type="number"
                  placeholder="0"
                  value={filters.min_viewers || ''}
                  onChange={(e) => updateFilter('min_viewers', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Max Viewers */}
              <div>
                <label className="text-gray-400 text-sm mb-2 block">Max Viewers</label>
                <input
                  type="number"
                  placeholder="∞"
                  value={filters.max_viewers || ''}
                  onChange={(e) => updateFilter('max_viewers', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Min Market Cap */}
              <div>
                <label className="text-gray-400 text-sm mb-2 block">Min Market Cap ($)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={filters.min_market_cap || ''}
                  onChange={(e) => updateFilter('min_market_cap', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Max Market Cap */}
              <div>
                <label className="text-gray-400 text-sm mb-2 block">Max Market Cap ($)</label>
                <input
                  type="number"
                  placeholder="∞"
                  value={filters.max_market_cap || ''}
                  onChange={(e) => updateFilter('max_market_cap', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Min Volume */}
              <div>
                <label className="text-gray-400 text-sm mb-2 block">Min 24h Volume ($)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={filters.min_volume_24h || ''}
                  onChange={(e) => updateFilter('min_volume_24h', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Max Volume */}
              <div>
                <label className="text-gray-400 text-sm mb-2 block">Max 24h Volume ($)</label>
                <input
                  type="number"
                  placeholder="∞"
                  value={filters.max_volume_24h || ''}
                  onChange={(e) => updateFilter('max_volume_24h', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

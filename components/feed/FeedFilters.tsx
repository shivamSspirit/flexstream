'use client';

import { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { POST_TYPES, FeedFilter } from '@/types';

interface FeedFiltersProps {
  filters: FeedFilter;
  onFiltersChange: (filters: FeedFilter) => void;
}

export function FeedFilters({ filters, onFiltersChange }: FeedFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);

  const handleFilterChange = (key: keyof FeedFilter, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-white">Filters</h3>
          {hasActiveFilters && (
            <Badge variant="secondary" className="text-xs">
              {Object.keys(filters).length} active
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="text-gray-400 hover:text-white"
          >
            {showFilters ? 'Hide' : 'Show'} Filters
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="space-y-4">
          {/* Post Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Post Type
            </label>
            <div className="flex flex-wrap gap-2">
              {POST_TYPES.map((type) => (
                <Button
                  key={type.value}
                  variant={filters.type === type.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => 
                    handleFilterChange('type', 
                      filters.type === type.value ? undefined : type.value
                    )
                  }
                  className={`text-sm ${type.color}`}
                >
                  <span className="mr-1">{type.icon}</span>
                  {type.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Verification Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Verification Status
            </label>
            <div className="flex space-x-2">
              <Button
                variant={filters.verified === true ? 'default' : 'outline'}
                size="sm"
                onClick={() => 
                  handleFilterChange('verified', 
                    filters.verified === true ? undefined : true
                  )
                }
                className="text-sm"
              >
                Verified Only
              </Button>
              <Button
                variant={filters.verified === false ? 'default' : 'outline'}
                size="sm"
                onClick={() => 
                  handleFilterChange('verified', 
                    filters.verified === false ? undefined : false
                  )
                }
                className="text-sm"
              >
                Unverified
              </Button>
            </div>
          </div>

          {/* Earnings Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Earnings Range
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Min earnings"
                value={filters.min_earnings || ''}
                onChange={(e) => 
                  handleFilterChange('min_earnings', 
                    e.target.value ? parseFloat(e.target.value) : undefined
                  )
                }
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <input
                type="number"
                placeholder="Max earnings"
                value={filters.max_earnings || ''}
                onChange={(e) => 
                  handleFilterChange('max_earnings', 
                    e.target.value ? parseFloat(e.target.value) : undefined
                  )
                }
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Time Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Time Range
            </label>
            <div className="flex space-x-2">
              {[
                { value: 'day', label: 'Today' },
                { value: 'week', label: 'This Week' },
                { value: 'month', label: 'This Month' },
                { value: 'all', label: 'All Time' },
              ].map((range) => (
                <Button
                  key={range.value}
                  variant={filters.time_range === range.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => 
                    handleFilterChange('time_range', 
                      filters.time_range === range.value ? undefined : range.value
                    )
                  }
                  className="text-sm"
                >
                  {range.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

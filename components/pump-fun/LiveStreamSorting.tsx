'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SortOption, SORT_OPTIONS, getSortOptionsByCategory } from '@/lib/sorting';

interface LiveStreamSortingProps {
  currentSort: SortOption;
  onSortChange: (sort: SortOption) => void;
  totalStreams: number;
}

export function LiveStreamSorting({ currentSort, onSortChange, totalStreams }: LiveStreamSortingProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const sortCategories = getSortOptionsByCategory();

  const currentSortConfig = SORT_OPTIONS.find(option => option.option === currentSort);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'market':
        return '💰';
      case 'volume':
        return '📊';
      case 'social':
        return '👥';
      case 'time':
        return '⏰';
      default:
        return '⚙️';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'market':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'volume':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'social':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'time':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <Card className="bg-white/5 backdrop-blur-md border-white/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-white text-lg">🔄</span>
            <CardTitle className="text-white text-lg">Sort Live Streams</CardTitle>
            <Badge variant="outline" className="border-white/20 text-white">
              {totalStreams} streams
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-white/20 text-white hover:bg-white/10"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </Button>
        </div>
        
        {/* Current Sort Display */}
        <div className="flex items-center space-x-2">
          <span className="text-gray-400 text-sm">Currently sorting by:</span>
          <Badge className={getCategoryColor(currentSortConfig?.category || '')}>
            <span className="mr-1">{getCategoryIcon(currentSortConfig?.category || '')}</span>
            <span>{currentSortConfig?.label}</span>
          </Badge>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-6">
            {Object.entries(sortCategories).map(([category, options]) => (
              <div key={category} className="space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getCategoryIcon(category)}</span>
                  <h3 className="text-white font-semibold capitalize">{category} Sorting</h3>
                  <Badge variant="outline" className={getCategoryColor(category)}>
                    {options.length} options
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {options.map((option) => (
                    <Button
                      key={option.option}
                      variant={currentSort === option.option ? "default" : "outline"}
                      size="sm"
                      className={`text-left justify-start h-auto p-3 ${
                        currentSort === option.option
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                          : 'border-white/20 text-white hover:bg-white/10'
                      }`}
                      onClick={() => onSortChange(option.option)}
                    >
                      <div className="flex items-center space-x-2 w-full">
                        <span className="text-sm flex-shrink-0">
                          {option.option.includes('_high') ? '⬆️' : option.option.includes('_low') ? '⬇️' : '🔄'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {option.label}
                          </div>
                          <div className="text-xs opacity-75 truncate">
                            {option.description}
                          </div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

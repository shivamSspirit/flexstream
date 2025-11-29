'use client';

import { Button } from '@/components/ui/button';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon
} from '@heroicons/react/24/outline';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export function PaginationControls({
  currentPage,
  totalPages,
  hasNextPage,
  hasPrevPage,
  onPageChange,
  isLoading = false
}: PaginationControlsProps) {
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && !isLoading) {
      onPageChange(page);
    }
  };

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-center space-x-2 mt-8">
      {/* First Page */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => handlePageChange(1)}
        disabled={!hasPrevPage || isLoading}
        className="border-white/20 text-white hover:bg-white/10 disabled:opacity-50"
      >
        <ChevronDoubleLeftIcon className="w-4 h-4" />
      </Button>

      {/* Previous Page */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={!hasPrevPage || isLoading}
        className="border-white/20 text-white hover:bg-white/10 disabled:opacity-50"
      >
        <ChevronLeftIcon className="w-4 h-4" />
      </Button>

      {/* Page Numbers */}
      {getVisiblePages().map((page, index) => (
        <div key={index}>
          {page === '...' ? (
            <span className="px-3 py-2 text-gray-400">...</span>
          ) : (
            <Button
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => handlePageChange(page as number)}
              disabled={isLoading}
              className={
                currentPage === page
                  ? "bg-gradient-to-r from-emerald-600 to-cyan-600 text-white hover:from-emerald-700 hover:to-cyan-700"
                  : "border-white/20 text-white hover:bg-white/10 disabled:opacity-50"
              }
            >
              {page}
            </Button>
          )}
        </div>
      ))}

      {/* Next Page */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={!hasNextPage || isLoading}
        className="border-white/20 text-white hover:bg-white/10 disabled:opacity-50"
      >
        <ChevronRightIcon className="w-4 h-4" />
      </Button>

      {/* Last Page */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => handlePageChange(totalPages)}
        disabled={!hasNextPage || isLoading}
        className="border-white/20 text-white hover:bg-white/10 disabled:opacity-50"
      >
        <ChevronDoubleRightIcon className="w-4 h-4" />
      </Button>
    </div>
  );
}

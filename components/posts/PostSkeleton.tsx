'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function PostSkeleton() {
  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gray-700 rounded-full animate-pulse" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <div className="h-4 w-24 bg-gray-700 rounded animate-pulse" />
                <div className="h-3 w-16 bg-gray-700 rounded animate-pulse" />
                <div className="h-5 w-8 bg-gray-700 rounded animate-pulse" />
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <div className="h-3 w-12 bg-gray-700 rounded animate-pulse" />
                <div className="h-3 w-1 bg-gray-700 rounded animate-pulse" />
                <div className="h-3 w-8 bg-gray-700 rounded animate-pulse" />
              </div>
            </div>
          </div>
          <div className="h-4 w-4 bg-gray-700 rounded animate-pulse" />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Content skeleton */}
        <div className="space-y-2">
          <div className="h-4 w-full bg-gray-700 rounded animate-pulse" />
          <div className="h-4 w-3/4 bg-gray-700 rounded animate-pulse" />
          <div className="h-4 w-1/2 bg-gray-700 rounded animate-pulse" />
        </div>

        {/* Earnings skeleton */}
        <div className="h-16 w-full bg-gray-700 rounded-lg animate-pulse" />

        {/* Media skeleton */}
        <div className="h-64 w-full bg-gray-700 rounded-lg animate-pulse" />

        {/* Actions skeleton */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-700">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 bg-gray-700 rounded animate-pulse" />
              <div className="h-3 w-6 bg-gray-700 rounded animate-pulse" />
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 bg-gray-700 rounded animate-pulse" />
              <div className="h-3 w-6 bg-gray-700 rounded animate-pulse" />
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 bg-gray-700 rounded animate-pulse" />
              <div className="h-3 w-6 bg-gray-700 rounded animate-pulse" />
            </div>
          </div>
          <div className="h-4 w-4 bg-gray-700 rounded animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

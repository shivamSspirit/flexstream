'use client';

import { Plus, TrendingUp, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export function EmptyState() {
  const router = useRouter();

  return (
    <div className="text-center py-12">
      <div className="max-w-md mx-auto">
        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
          <TrendingUp className="h-12 w-12 text-white" />
        </div>
        
        <h3 className="text-xl font-semibold text-white mb-2">
          No posts found
        </h3>
        
        <p className="text-gray-400 mb-6">
          Be the first to share your trading success story or stream highlight!
        </p>
        
        <div className="space-y-3">
          <Button
            onClick={() => router.push('/create')}
            className="flexstream-gradient w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Post
          </Button>
          
          <Button
            variant="outline"
            onClick={() => router.push('/discover')}
            className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            <Users className="h-4 w-4 mr-2" />
            Discover Other Users
          </Button>
        </div>
        
        <div className="mt-8 text-sm text-gray-500">
          <p>Share your:</p>
          <div className="flex justify-center space-x-4 mt-2">
            <span className="flex items-center">
              💰 Earnings flexes
            </span>
            <span className="flex items-center">
              🎥 Stream highlights
            </span>
            <span className="flex items-center">
              📈 Trading journeys
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

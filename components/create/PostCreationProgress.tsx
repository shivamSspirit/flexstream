'use client';

import { CheckCircleIcon, ClockIcon } from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';

export type CreationStage = 'uploading' | 'creating_post' | 'creating_token' | 'complete';

interface PostCreationProgressProps {
  currentStage: CreationStage;
  progress?: number; // 0-100 for uploading
  error?: string;
}

const stages = [
  {
    id: 'uploading' as const,
    label: 'Uploading Media',
    description: 'Uploading your image to storage...',
  },
  {
    id: 'creating_post' as const,
    label: 'Creating Post',
    description: 'Saving post to database...',
  },
  {
    id: 'creating_token' as const,
    label: 'Launching Token',
    description: 'Creating token on Meteora DBC...',
  },
  {
    id: 'complete' as const,
    label: 'Complete!',
    description: 'Your post and token are live!',
  },
];

export function PostCreationProgress({ currentStage, progress = 0, error }: PostCreationProgressProps) {
  const currentStageIndex = stages.findIndex(s => s.id === currentStage);

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-gray-900/95 backdrop-blur-lg rounded-xl border border-gray-800 shadow-xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-white mb-2">
          {error ? '❌ Creation Failed' : currentStage === 'complete' ? '🎉 Success!' : '⚡ Creating Your Post'}
        </h3>
        <p className="text-gray-400">
          {error || stages[currentStageIndex]?.description || 'Processing...'}
        </p>
      </div>

      {/* Stages */}
      <div className="space-y-4 mb-6">
        {stages.slice(0, -1).map((stage, index) => {
          const isComplete = index < currentStageIndex;
          const isCurrent = index === currentStageIndex;
          const isPending = index > currentStageIndex;

          return (
            <div
              key={stage.id}
              className={cn(
                'flex items-center gap-4 p-4 rounded-lg transition-all',
                isCurrent && 'bg-blue-500/10 border border-blue-500/30',
                isComplete && 'bg-green-500/10 border border-green-500/30',
                isPending && 'bg-gray-800/50 border border-gray-700/30'
              )}
            >
              {/* Icon */}
              <div
                className={cn(
                  'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all',
                  isCurrent && 'bg-blue-500 text-white animate-pulse',
                  isComplete && 'bg-green-500 text-white',
                  isPending && 'bg-gray-700 text-gray-400'
                )}
              >
                {isComplete ? (
                  <CheckCircleIcon className="w-6 h-6" />
                ) : isCurrent ? (
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ClockIcon className="w-6 h-6" />
                )}
              </div>

              {/* Stage Info */}
              <div className="flex-1">
                <div
                  className={cn(
                    'font-semibold text-sm transition-colors',
                    isCurrent && 'text-blue-400',
                    isComplete && 'text-green-400',
                    isPending && 'text-gray-400'
                  )}
                >
                  {stage.label}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{stage.description}</div>

                {/* Progress bar for uploading stage */}
                {isCurrent && stage.id === 'uploading' && progress > 0 && (
                  <div className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Checkmark or step number */}
              <div
                className={cn(
                  'text-xs font-mono',
                  isCurrent && 'text-blue-400',
                  isComplete && 'text-green-400',
                  isPending && 'text-gray-600'
                )}
              >
                {isComplete ? '✓' : index + 1}
              </div>
            </div>
          );
        })}
      </div>

      {/* Overall Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-400 mb-2">
          <span>Overall Progress</span>
          <span>{Math.round((currentStageIndex / (stages.length - 1)) * 100)}%</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full transition-all duration-500',
              error ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'
            )}
            style={{ width: `${(currentStageIndex / (stages.length - 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Tips */}
      {!error && currentStage !== 'complete' && (
        <div className="text-center text-sm text-gray-400 bg-gray-800/50 rounded-lg p-3">
          💡 Tip: Don't close this window. This process takes 10-15 seconds.
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="text-red-400 text-sm">{error}</div>
        </div>
      )}
    </div>
  );
}

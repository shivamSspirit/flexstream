'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, AlertCircle, Rocket } from 'lucide-react';
import { UploadingPost } from '@/hooks/useUploadingPosts';

interface UploadingPostCardProps {
  post: UploadingPost;
}

export function UploadingPostCard({ post }: UploadingPostCardProps) {
  const getStageText = () => {
    switch (post.uploadStage) {
      case 'uploading':
        return 'Uploading image...';
      case 'creating_post':
        return 'Creating post...';
      case 'creating_token':
        return 'Launching token...';
      case 'complete':
        return 'Live!';
      case 'error':
        return post.error || 'Failed';
      default:
        return 'Processing...';
    }
  };

  const getStageIcon = () => {
    switch (post.uploadStage) {
      case 'uploading':
      case 'creating_post':
        return <Loader2 className="h-4 w-4 animate-spin text-accent-cyan" />;
      case 'creating_token':
        return <Rocket className="h-4 w-4 animate-bounce text-accent-purple" />;
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-accent-green" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-metric-red" />;
      default:
        return <Loader2 className="h-4 w-4 animate-spin text-text-muted" />;
    }
  };

  const isError = post.uploadStage === 'error';
  const isComplete = post.uploadStage === 'complete';

  return (
    <Card
      className={`card-interactive bg-gradient-to-br ${
        isError
          ? 'from-metric-red/10 to-metric-red/5 border-2 border-metric-red/30'
          : isComplete
          ? 'from-accent-green/10 to-accent-cyan/10 border-2 border-accent-green/30'
          : 'from-accent-cyan/10 via-accent-purple/10 to-accent-blue/10 border-2 border-accent-cyan/30'
      } shadow-lg ${!isError && !isComplete ? 'animate-pulse-glow' : ''}`}
    >
      <CardHeader className="pb-3 px-4 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Avatar */}
            <Avatar className="h-12 w-12 ring-2 ring-accent-cyan/50 transition-all duration-300 shrink-0 shadow-lg">
              <AvatarImage src={post.users?.avatar_url || undefined} alt={post.users?.display_name} />
              <AvatarFallback className="bg-gradient-to-br from-accent-purple to-accent-pink text-white font-bold">
                {post.users?.display_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>

            {/* User Info */}
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-text-primary text-sm sm:text-base">
                  {post.users?.display_name || 'User'}
                </span>
                <span className="text-text-muted text-xs sm:text-sm font-medium">
                  @{post.users?.username || 'user'}
                </span>
                <Badge
                  variant={isError ? 'default' : isComplete ? 'gold' : 'default'}
                  className={`text-xs shrink-0 font-semibold ${
                    isError ? 'bg-metric-red/20 text-metric-red' : isComplete ? '' : 'bg-accent-cyan/20 text-accent-cyan animate-pulse'
                  }`}
                >
                  {isError ? 'Failed' : isComplete ? 'Complete!' : 'Creating...'}
                </Badge>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                {getStageIcon()}
                <span className={`font-medium ${isError ? 'text-metric-red' : 'text-text-muted'}`}>
                  {getStageText()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 space-y-3">
        {/* Image Preview */}
        {(post.media_urls?.[0] || post.preview_url) && (
          <div className="relative">
            <img
              src={post.media_urls?.[0] || post.preview_url}
              alt="Uploading"
              className={`w-full h-64 object-cover rounded-xl transition-all ${
                isComplete ? 'opacity-100' : 'opacity-60'
              }`}
            />

            {/* Overlay for non-complete states */}
            {!isComplete && !isError && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] rounded-xl flex items-center justify-center">
                <div className="text-center space-y-3">
                  {post.uploadStage === 'creating_token' ? (
                    <>
                      <Rocket className="h-12 w-12 animate-bounce text-accent-purple mx-auto drop-shadow-lg" />
                      <div className="text-white font-bold text-lg drop-shadow-lg">
                        Launching to the moon! 🚀
                      </div>
                    </>
                  ) : (
                    <>
                      <Loader2 className="h-12 w-12 animate-spin text-accent-cyan mx-auto drop-shadow-lg" />
                      <div className="text-white font-bold text-lg drop-shadow-lg">
                        {Math.round(post.uploadProgress)}%
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Success Checkmark */}
            {isComplete && (
              <div className="absolute top-3 right-3 bg-accent-green rounded-full p-2 shadow-lg animate-scale-in">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            )}

            {/* Error Icon */}
            {isError && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <div className="text-center space-y-2">
                  <AlertCircle className="h-12 w-12 text-metric-red mx-auto" />
                  <div className="text-metric-red font-bold">Upload Failed</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Progress Bar - Show only during upload stages */}
        {!isComplete && !isError && (
          <div className="space-y-2">
            <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-300 ease-out ${
                  post.uploadStage === 'creating_token'
                    ? 'bg-gradient-to-r from-accent-purple via-accent-pink to-accent-purple animate-gradient-x'
                    : 'bg-gradient-to-r from-accent-green via-accent-cyan to-accent-blue'
                }`}
                style={{ width: `${post.uploadProgress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-text-muted">
              <span className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-accent-cyan animate-pulse" />
                {post.uploadStage === 'uploading' && 'Uploading image...'}
                {post.uploadStage === 'creating_post' && 'Saving to database...'}
                {post.uploadStage === 'creating_token' && 'Creating token on Meteora...'}
              </span>
              <span className="font-mono font-bold">{Math.round(post.uploadProgress)}%</span>
            </div>
          </div>
        )}

        {/* Success Banner */}
        {isComplete && (
          <div className="bg-gradient-to-r from-accent-green/20 to-accent-cyan/20 border border-accent-green/30 rounded-xl p-4 text-center animate-scale-in">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-accent-green" />
              <p className="text-white font-bold">Post Live!</p>
            </div>
            <p className="text-text-muted text-xs">Your token is now tradable 🎉</p>
          </div>
        )}

        {/* Error Banner */}
        {isError && post.error && (
          <div className="bg-metric-red/20 border border-metric-red/30 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <AlertCircle className="h-5 w-5 text-metric-red" />
              <p className="text-metric-red font-bold text-sm">Upload Failed</p>
            </div>
            <p className="text-text-muted text-xs">{post.error}</p>
          </div>
        )}

        {/* Post Content */}
        {post.title && (
          <div className="pt-2">
            <p className="text-text-primary text-sm font-bold">{post.title}</p>
            {post.content && (
              <p className="text-text-muted text-xs mt-1 line-clamp-2">{post.content}</p>
            )}
          </div>
        )}
      </CardContent>

      <style jsx global>{`
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(34, 211, 238, 0.3);
          }
          50% {
            box-shadow: 0 0 30px rgba(34, 211, 238, 0.5);
          }
        }

        @keyframes scale-in {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes gradient-x {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }

        .animate-scale-in {
          animation: scale-in 0.5s ease-out;
        }

        .animate-gradient-x {
          background-size: 200% 100%;
          animation: gradient-x 2s ease infinite;
        }
      `}</style>
    </Card>
  );
}

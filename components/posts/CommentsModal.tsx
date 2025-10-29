'use client';

import { useState } from 'react';
import { MessageCircle, Lock } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PostComments } from './PostComments';

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  commentsCount: number;
}

export function CommentsModal({ isOpen, onClose, postId, commentsCount }: CommentsModalProps) {
  const [hasComments, setHasComments] = useState(commentsCount > 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl bg-gradient-to-br from-card-bg to-app-bg border-2 border-white/10 text-text-primary p-0 gap-0 max-h-[85vh] sm:max-h-[80vh] flex flex-col">
        {/* Header - Mobile Optimized */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-white/10 shrink-0 bg-gradient-to-r from-accent-cyan/5 to-accent-blue/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-accent-cyan to-accent-blue flex items-center justify-center shadow-lg">
              <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-accent-cyan to-accent-blue">
                Comments
              </h2>
              <p className="text-xs text-text-muted font-medium hidden sm:block">
                {hasComments ? `${commentsCount} ${commentsCount === 1 ? 'comment' : 'comments'}` : 'Be the first to comment'}
              </p>
            </div>
          </div>
        </div>

        {/* Content - Mobile Optimized Scrolling */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {!hasComments ? (
            /* No Comments State - Mobile Friendly */
            <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4 sm:px-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-accent-cyan/20 to-accent-blue/20 rounded-2xl flex items-center justify-center mb-4 sm:mb-5 shadow-lg">
                <MessageCircle className="w-8 h-8 sm:w-10 sm:h-10 text-accent-cyan" strokeWidth={2.5} />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white mb-2">No comments yet</h3>
              <p className="text-text-muted text-sm sm:text-base text-center max-w-xs leading-relaxed">
                Be the first to add a comment and start the conversation!
              </p>
            </div>
          ) : (
            /* Comments List - Mobile Padding */
            <div className="px-4 sm:px-6 py-3 sm:py-4">
              <PostComments postId={postId} />
            </div>
          )}
        </div>

        {/* Comment Input Footer - Mobile Optimized */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-white/10 shrink-0 bg-gradient-to-r from-transparent via-accent-purple/5 to-transparent">
          <div className="relative">
            <input
              type="text"
              placeholder="Add a comment..."
              disabled
              className="w-full px-4 py-3 sm:py-3.5 bg-white/5 border-2 border-white/10 rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-purple/50 focus:ring-2 focus:ring-accent-purple/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 sm:gap-2">
              <div className="p-1.5 sm:p-2 bg-accent-purple/20 rounded-lg">
                <Lock className="h-3 w-3 sm:h-4 sm:w-4 text-accent-purple" />
              </div>
              <span className="text-xs font-bold text-accent-purple hidden sm:inline">Become a holder</span>
              <span className="text-xs font-bold text-accent-purple sm:hidden">🔒 Holder only</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

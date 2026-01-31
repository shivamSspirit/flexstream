'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * SocialProofBadge - Shows friends' positions on a market
 *
 * Design: "The Inner Circle Signal"
 * - Shows avatars of friends betting
 * - Animated hover reveals names
 * - Creates FOMO / social proof
 */

interface Friend {
  id: string;
  username: string;
  avatar?: string;
}

interface SocialProofBadgeProps {
  yesFriends: Friend[];
  noFriends: Friend[];
  compact?: boolean;
  onViewAll?: () => void;
}

export function SocialProofBadge({
  yesFriends,
  noFriends,
  compact = false,
  onViewAll,
}: SocialProofBadgeProps) {
  const totalFriends = yesFriends.length + noFriends.length;

  if (totalFriends === 0) return null;

  if (compact) {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="flex items-center gap-2 px-2 py-1 rounded-lg bg-white/[0.03] border border-white/[0.04]"
      >
        {/* Stacked avatars */}
        <div className="flex -space-x-1.5">
          {[...yesFriends, ...noFriends].slice(0, 3).map((friend, i) => (
            <div
              key={friend.id}
              className={cn(
                "w-5 h-5 rounded-full border-2 border-[#0A0A0A] flex items-center justify-center",
                yesFriends.includes(friend)
                  ? "bg-[#FFD700]/20"
                  : "bg-[#C0C0C0]/20"
              )}
              style={{ zIndex: 3 - i }}
            >
              <span className={cn(
                "text-[8px] font-bold",
                yesFriends.includes(friend) ? "text-[#FFD700]" : "text-[#C0C0C0]"
              )}>
                {friend.username[0].toUpperCase()}
              </span>
            </div>
          ))}
          {totalFriends > 3 && (
            <div className="w-5 h-5 rounded-full border-2 border-[#0A0A0A] bg-white/[0.08] flex items-center justify-center">
              <span className="text-[8px] font-bold text-white/50">+{totalFriends - 3}</span>
            </div>
          )}
        </div>

        <span className="text-[10px] font-mono text-white/40">
          {totalFriends} friend{totalFriends > 1 ? 's' : ''}
        </span>
      </motion.div>
    );
  }

  return (
    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">
          Friends betting
        </span>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-[10px] font-mono text-[#E0FF62] hover:underline"
          >
            View all
          </button>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* YES friends */}
        {yesFriends.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {yesFriends.slice(0, 4).map((friend, i) => (
                <motion.div
                  key={friend.id}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="relative group"
                  style={{ zIndex: 4 - i }}
                >
                  <div className="w-7 h-7 rounded-full bg-[#FFD700]/10 border-2 border-[#0A0A0A] ring-1 ring-[#FFD700]/30 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-[#FFD700]">
                      {friend.username[0].toUpperCase()}
                    </span>
                  </div>

                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-[#FFD700] text-black text-[9px] font-mono font-bold rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    @{friend.username} → YES
                  </div>
                </motion.div>
              ))}
              {yesFriends.length > 4 && (
                <div className="w-7 h-7 rounded-full bg-[#FFD700]/5 border-2 border-[#0A0A0A] flex items-center justify-center">
                  <span className="text-[9px] font-bold text-[#FFD700]">+{yesFriends.length - 4}</span>
                </div>
              )}
            </div>
            <span className="text-xs font-mono text-[#FFD700]">
              {yesFriends.length} YES
            </span>
          </div>
        )}

        {/* Divider */}
        {yesFriends.length > 0 && noFriends.length > 0 && (
          <div className="h-6 w-px bg-white/[0.06]" />
        )}

        {/* NO friends */}
        {noFriends.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {noFriends.slice(0, 4).map((friend, i) => (
                <motion.div
                  key={friend.id}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="relative group"
                  style={{ zIndex: 4 - i }}
                >
                  <div className="w-7 h-7 rounded-full bg-[#C0C0C0]/10 border-2 border-[#0A0A0A] ring-1 ring-[#C0C0C0]/30 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-[#C0C0C0]">
                      {friend.username[0].toUpperCase()}
                    </span>
                  </div>

                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-[#C0C0C0] text-black text-[9px] font-mono font-bold rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    @{friend.username} → NO
                  </div>
                </motion.div>
              ))}
              {noFriends.length > 4 && (
                <div className="w-7 h-7 rounded-full bg-[#C0C0C0]/5 border-2 border-[#0A0A0A] flex items-center justify-center">
                  <span className="text-[9px] font-bold text-[#C0C0C0]">+{noFriends.length - 4}</span>
                </div>
              )}
            </div>
            <span className="text-xs font-mono text-[#C0C0C0]">
              {noFriends.length} NO
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * FriendActivityNotification - Real-time friend betting notification
 */
interface FriendActivityNotificationProps {
  friend: Friend;
  side: 'yes' | 'no';
  marketTitle: string;
  isVisible: boolean;
  onDismiss: () => void;
}

export function FriendActivityNotification({
  friend,
  side,
  marketTitle,
  isVisible,
  onDismiss,
}: FriendActivityNotificationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -50, x: '-50%' }}
      animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : -50 }}
      exit={{ opacity: 0, y: -50 }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] pointer-events-auto"
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl",
          "bg-[#0A0A0A] border",
          side === 'yes' ? "border-[#FFD700]/30" : "border-[#C0C0C0]/30"
        )}
      >
        {/* Avatar */}
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center",
          side === 'yes'
            ? "bg-[#FFD700]/10 border border-[#FFD700]/30"
            : "bg-[#C0C0C0]/10 border border-[#C0C0C0]/30"
        )}>
          <span className={cn(
            "text-sm font-bold",
            side === 'yes' ? "text-[#FFD700]" : "text-[#C0C0C0]"
          )}>
            {friend.username[0].toUpperCase()}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white">
            <span className="font-medium">@{friend.username}</span>
            {' '}just bet{' '}
            <span className={cn(
              "font-bold",
              side === 'yes' ? "text-[#FFD700]" : "text-[#C0C0C0]"
            )}>
              {side.toUpperCase()}
            </span>
          </p>
          <p className="text-xs text-white/40 truncate max-w-[200px]">
            {marketTitle}
          </p>
        </div>

        {/* Dismiss */}
        <button
          onClick={onDismiss}
          className="w-6 h-6 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition-colors"
        >
          <svg className="w-3 h-3 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </motion.div>
    </motion.div>
  );
}

'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * WinStreakBadge - Animated win streak display
 *
 * Design: "The Fire Trail"
 * - Animated flames for active streaks
 * - Dramatic reveal animation
 * - Multiple size variants
 */

interface WinStreakBadgeProps {
  streak: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animate?: boolean;
}

export function WinStreakBadge({
  streak,
  size = 'md',
  showLabel = true,
  animate = true,
}: WinStreakBadgeProps) {
  if (streak < 1) return null;

  const isHot = streak >= 3;
  const isOnFire = streak >= 5;
  const isLegendary = streak >= 10;

  // Size configurations
  const sizeConfig = {
    sm: {
      container: 'px-2 py-1 rounded-lg gap-1',
      flame: 'text-xs',
      number: 'text-xs',
      label: 'text-[9px]',
    },
    md: {
      container: 'px-3 py-1.5 rounded-xl gap-1.5',
      flame: 'text-sm',
      number: 'text-sm',
      label: 'text-[10px]',
    },
    lg: {
      container: 'px-4 py-2 rounded-2xl gap-2',
      flame: 'text-lg',
      number: 'text-lg',
      label: 'text-xs',
    },
  };

  const config = sizeConfig[size];

  // Color based on streak level
  const getColors = () => {
    if (isLegendary) {
      return {
        bg: 'from-violet-500/20 to-purple-600/10',
        border: 'border-violet-500/40',
        text: 'text-violet-400',
        glow: 'shadow-violet-500/30',
      };
    }
    if (isOnFire) {
      return {
        bg: 'from-orange-500/20 to-red-600/10',
        border: 'border-orange-500/40',
        text: 'text-orange-400',
        glow: 'shadow-orange-500/30',
      };
    }
    if (isHot) {
      return {
        bg: 'from-amber-500/20 to-orange-600/10',
        border: 'border-amber-500/40',
        text: 'text-amber-400',
        glow: 'shadow-amber-500/30',
      };
    }
    return {
      bg: 'from-white/10 to-white/5',
      border: 'border-white/20',
      text: 'text-white/60',
      glow: '',
    };
  };

  const colors = getColors();

  return (
    <motion.div
      initial={animate ? { scale: 0, opacity: 0 } : false}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', damping: 15, stiffness: 300 }}
      className={cn(
        "flex items-center border shadow-lg",
        `bg-gradient-to-r ${colors.bg}`,
        colors.border,
        colors.glow,
        config.container
      )}
    >
      {/* Flame icon(s) */}
      <div className="flex items-center">
        {isLegendary ? (
          <span className={config.flame}>👑</span>
        ) : isOnFire ? (
          <motion.span
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className={config.flame}
          >
            🔥
          </motion.span>
        ) : isHot ? (
          <span className={config.flame}>🔥</span>
        ) : (
          <span className={config.flame}>✨</span>
        )}
      </div>

      {/* Streak number */}
      <span className={cn("font-mono font-bold", colors.text, config.number)}>
        {streak}
      </span>

      {/* Label */}
      {showLabel && (
        <span className={cn("font-mono text-white/40", config.label)}>
          {streak === 1 ? 'win' : 'wins'}
        </span>
      )}
    </motion.div>
  );
}

/**
 * WinStreakCelebration - Full-screen celebration for streak milestones
 */
interface WinStreakCelebrationProps {
  streak: number;
  isVisible: boolean;
  onDismiss: () => void;
}

export function WinStreakCelebration({
  streak,
  isVisible,
  onDismiss,
}: WinStreakCelebrationProps) {
  if (!isVisible) return null;

  const getMessage = () => {
    if (streak >= 10) return { title: 'LEGENDARY', subtitle: 'You\'re unstoppable!' };
    if (streak >= 7) return { title: 'DOMINATING', subtitle: 'The oracle speaks through you!' };
    if (streak >= 5) return { title: 'ON FIRE', subtitle: 'Your predictions are blazing!' };
    if (streak >= 3) return { title: 'HEATING UP', subtitle: 'Keep the momentum going!' };
    return { title: 'NICE WIN', subtitle: 'Another one!' };
  };

  const message = getMessage();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onDismiss}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-xl"
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
        transition={{ type: 'spring', damping: 12 }}
        className="text-center"
      >
        {/* Animated flames */}
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="text-8xl mb-6"
        >
          {streak >= 10 ? '👑' : streak >= 5 ? '🔥' : '✨'}
        </motion.div>

        {/* Streak count */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="relative inline-block mb-4"
        >
          <div className="absolute inset-0 blur-3xl bg-[#E0FF62] opacity-30" />
          <span className="relative text-8xl font-mono font-black text-[#E0FF62]">
            {streak}
          </span>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-serif text-white mb-2"
          style={{ fontFamily: "'Cormorant Garabond', serif" }}
        >
          {message.title}
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-white/60 font-mono"
        >
          {message.subtitle}
        </motion.p>

        {/* Win streak label */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6"
        >
          <span className="px-4 py-2 rounded-xl bg-[#E0FF62]/10 border border-[#E0FF62]/30 text-[#E0FF62] font-mono font-bold">
            🔥 {streak} WIN STREAK
          </span>
        </motion.div>

        {/* Tap to dismiss */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 text-sm text-white/30 font-mono"
        >
          Tap anywhere to continue
        </motion.p>
      </motion.div>
    </motion.div>
  );
}

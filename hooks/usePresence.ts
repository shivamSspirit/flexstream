'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ═══════════════════════════════════════════════════════════════════════════════
// SUPABASE PRESENCE HOOKS - FOMO Counters
// ═══════════════════════════════════════════════════════════════════════════════
// Part of DB-FLEX-ARC-RECOMMENDED.md Phase 2 implementation
// Powers: "X online now", "X watching this token", "X trading right now"
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface PresenceState {
  user_id?: string;
  wallet?: string;
  username?: string;
  avatar_url?: string;
  joined_at: string;
}

interface PresenceData {
  count: number;
  users: PresenceState[];
}

interface UsePresenceOptions {
  channelName: string;
  userState?: Partial<PresenceState>;
  enabled?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Generic Presence Hook
// ─────────────────────────────────────────────────────────────────────────────

export function usePresence({
  channelName,
  userState,
  enabled = true,
}: UsePresenceOptions): PresenceData {
  const [presenceData, setPresenceData] = useState<PresenceData>({
    count: 0,
    users: [],
  });
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled || !supabase) {
      return;
    }

    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: userState?.user_id || `anon-${Date.now()}`,
        },
      },
    });

    // Handle presence sync (initial state + all updates)
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState<PresenceState>();
      const users: PresenceState[] = [];

      Object.values(state).forEach((presences) => {
        presences.forEach((presence) => {
          users.push(presence);
        });
      });

      setPresenceData({
        count: users.length,
        users,
      });
    });

    // Handle join events
    channel.on('presence', { event: 'join' }, ({ newPresences }) => {
      console.log(`[PRESENCE] ${newPresences.length} user(s) joined ${channelName}`);
    });

    // Handle leave events
    channel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
      console.log(`[PRESENCE] ${leftPresences.length} user(s) left ${channelName}`);
    });

    // Subscribe and track user
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        const trackState: PresenceState = {
          joined_at: new Date().toISOString(),
          ...userState,
        };
        await channel.track(trackState);
        console.log(`[PRESENCE] Tracking user in ${channelName}`);
      }
    });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase?.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [channelName, enabled, userState?.user_id]);

  return presenceData;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Platform Online Count Hook
// Powers: "1,247 traders online now" in header
// ─────────────────────────────────────────────────────────────────────────────

interface UsePlatformOnlineOptions {
  userId?: string;
  wallet?: string;
  username?: string;
  avatarUrl?: string;
  enabled?: boolean;
}

export function usePlatformOnline({
  userId,
  wallet,
  username,
  avatarUrl,
  enabled = true,
}: UsePlatformOnlineOptions = {}): number {
  const { count } = usePresence({
    channelName: 'platform:online',
    userState: userId
      ? {
          user_id: userId,
          wallet,
          username,
          avatar_url: avatarUrl,
        }
      : undefined,
    enabled,
  });

  return count;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Token Watchers Hook
// Powers: "89 watching this token" on token pages
// ─────────────────────────────────────────────────────────────────────────────

interface UseTokenWatchersOptions {
  tokenMint: string;
  userId?: string;
  wallet?: string;
  username?: string;
  enabled?: boolean;
}

interface TokenWatchersData extends PresenceData {
  tokenMint: string;
}

export function useTokenWatchers({
  tokenMint,
  userId,
  wallet,
  username,
  enabled = true,
}: UseTokenWatchersOptions): TokenWatchersData {
  const presenceData = usePresence({
    channelName: `token:${tokenMint}:viewers`,
    userState: userId
      ? {
          user_id: userId,
          wallet,
          username,
        }
      : undefined,
    enabled: enabled && !!tokenMint,
  });

  return {
    ...presenceData,
    tokenMint,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Profile Viewers Hook
// Powers: "34 viewing this profile" on creator pages
// ─────────────────────────────────────────────────────────────────────────────

interface UseProfileViewersOptions {
  profileUserId: string;
  viewerUserId?: string;
  viewerWallet?: string;
  enabled?: boolean;
}

export function useProfileViewers({
  profileUserId,
  viewerUserId,
  viewerWallet,
  enabled = true,
}: UseProfileViewersOptions): PresenceData {
  return usePresence({
    channelName: `profile:${profileUserId}:viewers`,
    userState: viewerUserId
      ? {
          user_id: viewerUserId,
          wallet: viewerWallet,
        }
      : undefined,
    enabled: enabled && !!profileUserId,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Active Traders Hook
// Powers: "X trading right now" indicator
// ─────────────────────────────────────────────────────────────────────────────

interface UseActiveTradersOptions {
  userId?: string;
  wallet?: string;
  enabled?: boolean;
}

export function useActiveTraders({
  userId,
  wallet,
  enabled = true,
}: UseActiveTradersOptions = {}): number {
  const { count } = usePresence({
    channelName: 'trading:active',
    userState: userId
      ? {
          user_id: userId,
          wallet,
        }
      : undefined,
    enabled,
  });

  return count;
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Post Viewers Hook
// Powers: "X viewing this post" on post detail pages
// ─────────────────────────────────────────────────────────────────────────────

interface UsePostViewersOptions {
  postId: string;
  userId?: string;
  enabled?: boolean;
}

export function usePostViewers({
  postId,
  userId,
  enabled = true,
}: UsePostViewersOptions): PresenceData {
  return usePresence({
    channelName: `post:${postId}:viewers`,
    userState: userId
      ? {
          user_id: userId,
        }
      : undefined,
    enabled: enabled && !!postId,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Live Trade Feed Hook (Broadcast, not Presence)
// Powers: Real-time trade ticker
// ─────────────────────────────────────────────────────────────────────────────

interface Trade {
  id: string;
  mint_address: string;
  trader_wallet: string;
  trade_type: 'buy' | 'sell';
  base_amount: number;
  quote_amount: number;
  price_per_token: number;
  created_at: string;
}

interface UseLiveTradesOptions {
  tokenMint?: string; // If provided, filter to specific token
  enabled?: boolean;
  maxTrades?: number;
}

export function useLiveTrades({
  tokenMint,
  enabled = true,
  maxTrades = 50,
}: UseLiveTradesOptions = {}): Trade[] {
  const [trades, setTrades] = useState<Trade[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const addTrade = useCallback(
    (trade: Trade) => {
      setTrades((prev) => {
        const newTrades = [trade, ...prev].slice(0, maxTrades);
        return newTrades;
      });
    },
    [maxTrades]
  );

  useEffect(() => {
    if (!enabled || !supabase) {
      return;
    }

    const channelName = tokenMint ? `trade:${tokenMint}` : 'trade:global';

    const channel = supabase
      .channel(channelName)
      .on('broadcast', { event: 'INSERT' }, ({ payload }) => {
        if (payload?.new) {
          addTrade(payload.new as Trade);
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[LIVE TRADES] Subscribed to ${channelName}`);
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase?.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [tokenMint, enabled, addTrade]);

  return trades;
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. Live Notifications Hook (Broadcast, not Presence)
// Powers: Real-time notification badge
// ─────────────────────────────────────────────────────────────────────────────

interface Notification {
  id: string;
  type: string;
  from_user_id: string;
  post_id?: string;
  message?: string;
  read: boolean;
  created_at: string;
}

interface UseLiveNotificationsOptions {
  userId: string;
  enabled?: boolean;
}

export function useLiveNotifications({
  userId,
  enabled = true,
}: UseLiveNotificationsOptions): {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
} {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled || !userId || !supabase) {
      return;
    }

    const channel = supabase
      .channel(`notify:${userId}`)
      .on('broadcast', { event: 'INSERT' }, ({ payload }) => {
        if (payload?.new) {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[NOTIFICATIONS] Subscribed to notify:${userId}`);
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase?.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId, enabled]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  return { notifications, unreadCount, markAsRead };
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. Simulated FOMO Counters (for demo/testing)
// Use this before presence is fully connected
// ─────────────────────────────────────────────────────────────────────────────

interface UseSimulatedFOMOOptions {
  baseOnline?: number;
  baseWatching?: number;
  baseTrading?: number;
  volatility?: number; // How much the numbers fluctuate (0-1)
  updateInterval?: number; // ms
}

export function useSimulatedFOMO({
  baseOnline = 1247,
  baseWatching = 89,
  baseTrading = 34,
  volatility = 0.1,
  updateInterval = 3000,
}: UseSimulatedFOMOOptions = {}) {
  const [counts, setCounts] = useState({
    online: baseOnline,
    watching: baseWatching,
    trading: baseTrading,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setCounts({
        online: Math.round(baseOnline * (1 + (Math.random() - 0.5) * volatility)),
        watching: Math.round(baseWatching * (1 + (Math.random() - 0.5) * volatility)),
        trading: Math.round(baseTrading * (1 + (Math.random() - 0.5) * volatility)),
      });
    }, updateInterval);

    return () => clearInterval(interval);
  }, [baseOnline, baseWatching, baseTrading, volatility, updateInterval]);

  return counts;
}

// ─────────────────────────────────────────────────────────────────────────────
// Export convenience hook that combines all FOMO data
// ─────────────────────────────────────────────────────────────────────────────

interface UseFOMOOptions {
  userId?: string;
  wallet?: string;
  username?: string;
  tokenMint?: string;
  postId?: string;
  profileUserId?: string;
  useSimulated?: boolean;
}

export function useFOMO({
  userId,
  wallet,
  username,
  tokenMint,
  postId,
  profileUserId,
  useSimulated = false,
}: UseFOMOOptions = {}) {
  // Use simulated data if requested (for development/demo)
  const simulated = useSimulatedFOMO();

  // Real presence data
  const platformOnline = usePlatformOnline({
    userId,
    wallet,
    username,
    enabled: !useSimulated,
  });

  const tokenWatchers = useTokenWatchers({
    tokenMint: tokenMint || '',
    userId,
    wallet,
    username,
    enabled: !useSimulated && !!tokenMint,
  });

  const postViewers = usePostViewers({
    postId: postId || '',
    userId,
    enabled: !useSimulated && !!postId,
  });

  const profileViewers = useProfileViewers({
    profileUserId: profileUserId || '',
    viewerUserId: userId,
    viewerWallet: wallet,
    enabled: !useSimulated && !!profileUserId,
  });

  const activeTraders = useActiveTraders({
    userId,
    wallet,
    enabled: !useSimulated,
  });

  if (useSimulated) {
    return {
      online: simulated.online,
      watching: simulated.watching,
      trading: simulated.trading,
      tokenWatchers: simulated.watching,
      postViewers: Math.round(simulated.watching / 2),
      profileViewers: Math.round(simulated.watching / 3),
    };
  }

  return {
    online: platformOnline,
    watching: tokenWatchers.count,
    trading: activeTraders,
    tokenWatchers: tokenWatchers.count,
    postViewers: postViewers.count,
    profileViewers: profileViewers.count,
  };
}

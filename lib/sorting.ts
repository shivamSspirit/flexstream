/**
 * Sorting utilities for live streams data
 */

import { PumpFunLiveStream } from '@/types';

export type SortOption = 
  | 'market_cap_high' 
  | 'market_cap_low'
  | 'volume_24h_high' 
  | 'volume_24h_low'
  | 'volume_7d_high' 
  | 'volume_7d_low'
  | 'volume_1h_high' 
  | 'volume_1h_low'
  | 'viewers_high' 
  | 'viewers_low'
  | 'price_change_24h_high' 
  | 'price_change_24h_low'
  | 'trades_24h_high' 
  | 'trades_24h_low'
  | 'liquidity_high' 
  | 'liquidity_low'
  | 'holders_high' 
  | 'holders_low'
  | 'newest' 
  | 'oldest';

export interface SortConfig {
  option: SortOption;
  label: string;
  description: string;
  category: 'market' | 'volume' | 'social' | 'time';
}

export const SORT_OPTIONS: SortConfig[] = [
  // Market Cap
  {
    option: 'market_cap_high',
    label: 'Market Cap (High to Low)',
    description: 'Sort by highest market capitalization',
    category: 'market'
  },
  {
    option: 'market_cap_low',
    label: 'Market Cap (Low to High)',
    description: 'Sort by lowest market capitalization',
    category: 'market'
  },
  
  // Volume - 24h
  {
    option: 'volume_24h_high',
    label: '24h Volume (High to Low)',
    description: 'Sort by highest 24-hour trading volume',
    category: 'volume'
  },
  {
    option: 'volume_24h_low',
    label: '24h Volume (Low to High)',
    description: 'Sort by lowest 24-hour trading volume',
    category: 'volume'
  },
  
  // Volume - 7d
  {
    option: 'volume_7d_high',
    label: '7d Volume (High to Low)',
    description: 'Sort by highest 7-day trading volume',
    category: 'volume'
  },
  {
    option: 'volume_7d_low',
    label: '7d Volume (Low to High)',
    description: 'Sort by lowest 7-day trading volume',
    category: 'volume'
  },
  
  // Volume - 1h
  {
    option: 'volume_1h_high',
    label: '1h Volume (High to Low)',
    description: 'Sort by highest 1-hour trading volume',
    category: 'volume'
  },
  {
    option: 'volume_1h_low',
    label: '1h Volume (Low to High)',
    description: 'Sort by lowest 1-hour trading volume',
    category: 'volume'
  },
  
  // Viewers
  {
    option: 'viewers_high',
    label: 'Viewers (High to Low)',
    description: 'Sort by highest number of stream viewers',
    category: 'social'
  },
  {
    option: 'viewers_low',
    label: 'Viewers (Low to High)',
    description: 'Sort by lowest number of stream viewers',
    category: 'social'
  },
  
  // Price Change
  {
    option: 'price_change_24h_high',
    label: 'Price Change 24h (High to Low)',
    description: 'Sort by highest 24-hour price change',
    category: 'market'
  },
  {
    option: 'price_change_24h_low',
    label: 'Price Change 24h (Low to High)',
    description: 'Sort by lowest 24-hour price change',
    category: 'market'
  },
  
  // Trades
  {
    option: 'trades_24h_high',
    label: '24h Trades (High to Low)',
    description: 'Sort by highest number of 24-hour trades',
    category: 'volume'
  },
  {
    option: 'trades_24h_low',
    label: '24h Trades (Low to High)',
    description: 'Sort by lowest number of 24-hour trades',
    category: 'volume'
  },
  
  // Liquidity
  {
    option: 'liquidity_high',
    label: 'Liquidity (High to Low)',
    description: 'Sort by highest liquidity',
    category: 'market'
  },
  {
    option: 'liquidity_low',
    label: 'Liquidity (Low to High)',
    description: 'Sort by lowest liquidity',
    category: 'market'
  },
  
  // Holders
  {
    option: 'holders_high',
    label: 'Holders (High to Low)',
    description: 'Sort by highest number of token holders',
    category: 'social'
  },
  {
    option: 'holders_low',
    label: 'Holders (Low to High)',
    description: 'Sort by lowest number of token holders',
    category: 'social'
  },
  
  // Time
  {
    option: 'newest',
    label: 'Newest First',
    description: 'Sort by newest tokens first',
    category: 'time'
  },
  {
    option: 'oldest',
    label: 'Oldest First',
    description: 'Sort by oldest tokens first',
    category: 'time'
  }
];

/**
 * Sort live streams based on the selected option
 */
export function sortLiveStreams(streams: PumpFunLiveStream[], sortOption: SortOption): PumpFunLiveStream[] {
  if (!streams || streams.length === 0) return streams;

  const sortedStreams = [...streams].sort((a, b) => {
    switch (sortOption) {
      // Market Cap
      case 'market_cap_high':
        return (b.trading_activity?.market_cap || 0) - (a.trading_activity?.market_cap || 0);
      case 'market_cap_low':
        return (a.trading_activity?.market_cap || 0) - (b.trading_activity?.market_cap || 0);
      
      // Volume - 24h
      case 'volume_24h_high':
        return (b.trading_activity?.total_volume_24h || 0) - (a.trading_activity?.total_volume_24h || 0);
      case 'volume_24h_low':
        return (a.trading_activity?.total_volume_24h || 0) - (b.trading_activity?.total_volume_24h || 0);
      
      // Volume - 7d
      case 'volume_7d_high':
        return (b.trading_activity?.volume_7d || 0) - (a.trading_activity?.volume_7d || 0);
      case 'volume_7d_low':
        return (a.trading_activity?.volume_7d || 0) - (b.trading_activity?.volume_7d || 0);
      
      // Volume - 1h
      case 'volume_1h_high':
        return (b.trading_activity?.volume_1h || 0) - (a.trading_activity?.volume_1h || 0);
      case 'volume_1h_low':
        return (a.trading_activity?.volume_1h || 0) - (b.trading_activity?.volume_1h || 0);
      
      // Viewers
      case 'viewers_high':
        return (b.stream_info?.viewer_count || 0) - (a.stream_info?.viewer_count || 0);
      case 'viewers_low':
        return (a.stream_info?.viewer_count || 0) - (b.stream_info?.viewer_count || 0);
      
      // Price Change
      case 'price_change_24h_high':
        return (b.trading_activity?.price_change_24h || 0) - (a.trading_activity?.price_change_24h || 0);
      case 'price_change_24h_low':
        return (a.trading_activity?.price_change_24h || 0) - (b.trading_activity?.price_change_24h || 0);
      
      // Trades
      case 'trades_24h_high':
        return (b.trading_activity?.trades_count_24h || 0) - (a.trading_activity?.trades_count_24h || 0);
      case 'trades_24h_low':
        return (a.trading_activity?.trades_count_24h || 0) - (b.trading_activity?.trades_count_24h || 0);
      
      // Liquidity
      case 'liquidity_high':
        return (b.token.liquidity_usd || 0) - (a.token.liquidity_usd || 0);
      case 'liquidity_low':
        return (a.token.liquidity_usd || 0) - (b.token.liquidity_usd || 0);
      
      // Holders
      case 'holders_high':
        return (b.token.holders_count || 0) - (a.token.holders_count || 0);
      case 'holders_low':
        return (a.token.holders_count || 0) - (b.token.holders_count || 0);
      
      // Time
      case 'newest':
        return (b.token.created_timestamp || 0) - (a.token.created_timestamp || 0);
      case 'oldest':
        return (a.token.created_timestamp || 0) - (b.token.created_timestamp || 0);
      
      default:
        return 0;
    }
  });

  return sortedStreams;
}

/**
 * Get sort options grouped by category
 */
export function getSortOptionsByCategory() {
  const categories = {
    market: SORT_OPTIONS.filter(option => option.category === 'market'),
    volume: SORT_OPTIONS.filter(option => option.category === 'volume'),
    social: SORT_OPTIONS.filter(option => option.category === 'social'),
    time: SORT_OPTIONS.filter(option => option.category === 'time')
  };
  
  return categories;
}

/**
 * Get the default sort option
 */
export function getDefaultSortOption(): SortOption {
  return 'market_cap_high';
}

/**
 * Format sort option for display
 */
export function formatSortOption(option: SortOption): string {
  const config = SORT_OPTIONS.find(opt => opt.option === option);
  return config ? config.label : option;
}

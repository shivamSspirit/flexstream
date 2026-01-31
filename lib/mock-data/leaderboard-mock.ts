/**
 * Viral Leaderboard Mock Data Generator
 * Based on Nikita Bier's viral app strategies
 * Creates addictive, aspirational, and engaging mock data
 */

export interface MockTrader {
  rank: number;
  username: string;
  walletAddress: string;
  displayName: string;
  avatar: string;
  volume: string;
  volumeRaw: number;
  trades: number;
  winRate: number;
  change: string;
  changePercent: number;
  verified: boolean;
  tier: 'bronze' | 'silver' | 'gold' | 'diamond' | 'legend';
  streak: number;
  trending: 'up' | 'down' | 'stable';
  badge?: string;
  tagline?: string;
}

// Aspirational trader names (creates FOMO)
const traderNames = [
  { name: 'CryptoKing', username: 'cryptoking', tagline: '👑 King of DeFi' },
  { name: 'SolanaWhale', username: 'solanawhale', tagline: '🐋 Whale Moves Only' },
  { name: 'TokenMaster', username: 'tokenmaster', tagline: '🎯 Never Miss' },
  { name: 'Diamond Hands', username: 'diamondhands', tagline: '💎 HODL Legend' },
  { name: 'Moon Walker', username: 'moonwalker', tagline: '🌙 To The Moon' },
  { name: 'Alpha Hunter', username: 'alphahunter', tagline: '🎯 Alpha Seeker' },
  { name: 'Degen Queen', username: 'degenqueen', tagline: '👸 Queen of Degen' },
  { name: 'Profit Prophet', username: 'profitprophet', tagline: '🔮 Sees The Future' },
  { name: 'NFT Ninja', username: 'nftninja', tagline: '🥷 Silent But Deadly' },
  { name: 'Gem Finder', username: 'gemfinder', tagline: '💎 100x Hunter' },
  { name: 'Ape Master', username: 'apemaster', tagline: '🦍 Apes Together Strong' },
  { name: 'Lambo Soon', username: 'lambosoon', tagline: '🏎️ Lambo Loading...' },
  { name: 'Rocket Man', username: 'rocketman', tagline: '🚀 Next Stop: Mars' },
  { name: 'Yield Farmer', username: 'yieldfarmer', tagline: '🌾 Farming Gains' },
  { name: 'Flash Trader', username: 'flashtrader', tagline: '⚡ Speed Is Key' },
  { name: 'Bag Holder', username: 'bagholder', tagline: '💰 Heavy Bags' },
  { name: 'Pump Chaser', username: 'pumpchaser', tagline: '📈 Pump Detector' },
  { name: 'Dip Buyer', username: 'dipbuyer', tagline: '📉 Buy The Dip' },
  { name: 'Moonshot Mike', username: 'moonshotmike', tagline: '🌙 Moonshots Only' },
  { name: 'Whale Watcher', username: 'whalewatcher', tagline: '👀 Follow The Whales' },
  { name: 'FOMO Fighter', username: 'fomofighter', tagline: '😤 No FOMO Here' },
  { name: 'Trend Setter', username: 'trendsetter', tagline: '📊 Setting Trends' },
  { name: 'Risk Taker', username: 'risktaker', tagline: '🎲 High Risk High Reward' },
  { name: 'Smart Money', username: 'smartmoney', tagline: '🧠 Big Brain Plays' },
  { name: 'Paper Hands', username: 'paperhands', tagline: '📄 Quick Exit' },
  { name: 'HODL Hero', username: 'hodlhero', tagline: '🦸 Never Selling' },
  { name: 'Swing Trader', username: 'swingtrader', tagline: '🎢 Riding The Waves' },
  { name: 'Day Trader Dan', username: 'daytraderdan', tagline: '☀️ Day Trading Pro' },
  { name: 'Night Owl', username: 'nightowl', tagline: '🦉 Trading After Hours' },
  { name: 'Bot Destroyer', username: 'botdestroyer', tagline: '🤖 Anti-Bot Gang' },
  { name: 'Meme Lord', username: 'memelord', tagline: '😂 Memes = Dreams' },
  { name: 'Shiba Soldier', username: 'shibasoldier', tagline: '🐕 To The Moon' },
  { name: 'Doge Warrior', username: 'dogewarrior', tagline: '🐶 Much Wow' },
  { name: 'Pepe Trader', username: 'pepetrader', tagline: '🐸 Feels Good Man' },
  { name: 'Chad Investor', username: 'chadinvestor', tagline: '💪 Gigachad Energy' },
  { name: 'Beta Tester', username: 'betatester', tagline: '🧪 Early Adopter' },
  { name: 'OG Holder', username: 'ogholder', tagline: '👴 Been Here Since Day 1' },
  { name: 'New Blood', username: 'newblood', tagline: '🩸 Fresh On The Scene' },
  { name: 'Veteran Trader', username: 'veterantrader', tagline: '🎖️ Battle Tested' },
  { name: 'Rookie Star', username: 'rookiestar', tagline: '⭐ Rising Star' },
  { name: 'Pro Gamer', username: 'progamer', tagline: '🎮 Gaming The Market' },
  { name: 'Speed Demon', username: 'speeddemon', tagline: '👹 Fast & Furious' },
  { name: 'Slow Cooker', username: 'slowcooker', tagline: '🍲 Patience Pays' },
  { name: 'Quick Flip', username: 'quickflip', tagline: '🔄 In & Out' },
  { name: 'Long Term Leo', username: 'longtermleo', tagline: '📅 Long Term Vision' },
  { name: 'Scalper Sam', username: 'scalpersam', tagline: '✂️ Scalping Profits' },
  { name: 'Arbitrage Ace', username: 'arbitrageace', tagline: '⚖️ Arbitrage Master' },
  { name: 'Leverage King', username: 'leverageking', tagline: '📊 10x Leverage' },
  { name: 'Spot Trader', username: 'spottrader', tagline: '📍 Spot Trading Only' },
  { name: 'Future Fomo', username: 'futurefomo', tagline: '🔮 Futures Trading' },
];

// High-quality avatar URLs (aspirational)
const avatarUrls = [
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1463453091185-61582044d556?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop',
];

/**
 * Generate aspirational volume (creates FOMO)
 */
function generateVolume(rank: number): { display: string; raw: number } {
  // Top ranks have HUGE volumes (creates aspiration)
  if (rank === 1) {
    const vol = 5000000 + Math.random() * 2000000; // $5M - $7M
    return { display: `$${(vol / 1000000).toFixed(2)}M`, raw: vol };
  }
  if (rank === 2) {
    const vol = 3000000 + Math.random() * 1500000; // $3M - $4.5M
    return { display: `$${(vol / 1000000).toFixed(2)}M`, raw: vol };
  }
  if (rank === 3) {
    const vol = 2000000 + Math.random() * 800000; // $2M - $2.8M
    return { display: `$${(vol / 1000000).toFixed(2)}M`, raw: vol };
  }
  if (rank <= 10) {
    const vol = 800000 + Math.random() * 1000000; // $800K - $1.8M
    return { display: `$${(vol / 1000000).toFixed(2)}M`, raw: vol };
  }
  if (rank <= 20) {
    const vol = 400000 + Math.random() * 300000; // $400K - $700K
    return { display: `$${(vol / 1000).toFixed(0)}K`, raw: vol };
  }
  if (rank <= 50) {
    const vol = 150000 + Math.random() * 200000; // $150K - $350K
    return { display: `$${(vol / 1000).toFixed(0)}K`, raw: vol };
  }
  if (rank <= 100) {
    const vol = 50000 + Math.random() * 80000; // $50K - $130K
    return { display: `$${(vol / 1000).toFixed(0)}K`, raw: vol };
  }

  // Lower ranks
  const vol = 10000 + Math.random() * 35000; // $10K - $45K
  return { display: `$${(vol / 1000).toFixed(0)}K`, raw: vol };
}

/**
 * Determine tier based on rank (gamification)
 */
function getTier(rank: number): 'bronze' | 'silver' | 'gold' | 'diamond' | 'legend' {
  if (rank === 1) return 'legend';
  if (rank <= 3) return 'diamond';
  if (rank <= 10) return 'gold';
  if (rank <= 50) return 'silver';
  return 'bronze';
}

/**
 * Generate trending status (creates urgency)
 */
function getTrending(rank: number): 'up' | 'down' | 'stable' {
  if (rank <= 10) {
    // Top 10 mostly stable or up
    const rand = Math.random();
    if (rand < 0.7) return 'up';
    if (rand < 0.9) return 'stable';
    return 'down';
  }

  // Others have mixed trending
  const rand = Math.random();
  if (rand < 0.4) return 'up';
  if (rand < 0.7) return 'stable';
  return 'down';
}

/**
 * Generate mock leaderboard data
 */
export function generateMockLeaderboard(count: number = 50): MockTrader[] {
  const traders: MockTrader[] = [];

  for (let i = 0; i < count; i++) {
    const rank = i + 1;
    const traderInfo = traderNames[i % traderNames.length];
    const volume = generateVolume(rank);

    // High win rates for top traders (creates aspiration)
    const baseWinRate = rank <= 10 ? 75 : rank <= 50 ? 65 : 55;
    const winRate = baseWinRate + Math.random() * 20;

    // Trades count (higher for top traders)
    const trades = rank <= 10
      ? 1500 + Math.floor(Math.random() * 500)
      : rank <= 50
      ? 800 + Math.floor(Math.random() * 400)
      : 300 + Math.floor(Math.random() * 300);

    // Change percentage (mostly positive for top traders)
    const changePercent = rank <= 10
      ? 25 + Math.random() * 30 // +25% to +55%
      : rank <= 50
      ? 15 + Math.random() * 20 // +15% to +35%
      : 5 + Math.random() * 15; // +5% to +20%

    // Generate a fake wallet address (base58 characters)
    const walletChars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    const walletAddress = Array.from({ length: 44 }, () => walletChars[Math.floor(Math.random() * walletChars.length)]).join('');

    traders.push({
      rank,
      username: `${traderInfo.username}${rank > traderNames.length ? rank : ''}`,
      walletAddress,
      displayName: `${traderInfo.name}${rank > traderNames.length ? ` #${rank}` : ''}`,
      avatar: avatarUrls[i % avatarUrls.length],
      volume: volume.display,
      volumeRaw: volume.raw,
      trades,
      winRate: Math.min(99, winRate),
      change: `+${changePercent.toFixed(0)}%`,
      changePercent,
      verified: rank <= 20 || Math.random() > 0.7, // Top 20 always verified
      tier: getTier(rank),
      streak: rank <= 10 ? Math.floor(Math.random() * 15) + 5 : Math.floor(Math.random() * 10),
      trending: getTrending(rank),
      badge: rank <= 3 ? ['🏆', '🥈', '🥉'][rank - 1] : undefined,
      tagline: traderInfo.tagline,
    });
  }

  return traders;
}

/**
 * Get user's mock position (for "you vs others" psychology)
 */
export function generateUserMockPosition(userRank: number = 247): {
  user: MockTrader;
  nearbyTraders: MockTrader[];
} {
  const allTraders = generateMockLeaderboard(300);
  const user = allTraders[userRank - 1];

  // Show 3 above and 3 below (near-miss psychology)
  const start = Math.max(0, userRank - 4);
  const end = Math.min(allTraders.length, userRank + 3);
  const nearbyTraders = allTraders.slice(start, end);

  return { user, nearbyTraders };
}

/**
 * Flex Bonding Curve Implementation
 *
 * This is the core math that powers the "early = big returns" mechanic.
 * Unlike Polymarket's fixed $0-$1 range, Flex Hype Tokens can pump
 * like meme coins based on social sentiment.
 *
 * Formula: P(n) = P₀ × e^(k × n)
 * Where:
 *   P₀ = base price (starting at $0.001)
 *   k  = curve steepness (0.0001)
 *   n  = current token supply
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface BondingCurveConfig {
  basePrice: number;      // P₀ - Starting price in SOL (default: 0.001)
  curveK: number;         // k - Curve steepness (default: 0.0001)
  currentSupply: number;  // n - Current token supply
}

export interface BuyQuote {
  tokensReceived: number;
  avgPrice: number;
  totalCost: number;
  priceImpact: number;        // % price increase from this buy
  positionNumber: number;     // Which buyer # you are
  potentialReturn: number;    // If outcome = YES, max return multiplier
  earlyBonus: string;         // "Top 100 buyer" etc.
}

export interface SellQuote {
  solReceived: number;
  avgPrice: number;
  priceImpact: number;        // % price decrease from this sell
  profitLoss: number;         // Based on avg buy price
}

export interface CurveState {
  currentPrice: number;
  totalSupply: number;
  marketCap: number;          // Total value locked in curve
  priceAt100: number;         // Price after 100 buyers
  priceAt1000: number;        // Price after 1000 buyers
  priceAt10000: number;       // Price after 10000 buyers
}

// ═══════════════════════════════════════════════════════════════════════════════
// CORE BONDING CURVE MATH
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate current price at given supply
 * P(n) = P₀ × e^(k × n)
 */
export function getCurrentPrice(config: BondingCurveConfig): number {
  const { basePrice, curveK, currentSupply } = config;
  return basePrice * Math.exp(curveK * currentSupply);
}

/**
 * Calculate price at a specific supply level
 */
export function getPriceAtSupply(
  basePrice: number,
  curveK: number,
  supply: number
): number {
  return basePrice * Math.exp(curveK * supply);
}

/**
 * Calculate tokens received for a given SOL amount
 * Uses integral of bonding curve for accurate calculation
 *
 * Integral: ∫P₀e^(kn)dn = (P₀/k)e^(kn)
 * Tokens = (1/k) × ln(1 + (solAmount × k) / currentPrice)
 */
export function calculateBuyTokens(
  config: BondingCurveConfig,
  solAmount: number
): BuyQuote {
  const { basePrice, curveK, currentSupply } = config;
  const currentPrice = getCurrentPrice(config);

  // Tokens received (inverse of integral)
  const tokensReceived = Math.log(1 + (solAmount * curveK) / currentPrice) / curveK;

  // New supply after purchase
  const newSupply = currentSupply + tokensReceived;
  const newPrice = getPriceAtSupply(basePrice, curveK, newSupply);

  // Average price paid
  const avgPrice = solAmount / tokensReceived;

  // Price impact
  const priceImpact = ((newPrice - currentPrice) / currentPrice) * 100;

  // Position number (which buyer you are)
  const positionNumber = Math.floor(currentSupply) + 1;

  // Potential return if outcome = YES (token redeems at $1)
  // Note: In SOL terms, assume 1 SOL ≈ $200 for calculation
  const potentialReturn = 1.0 / avgPrice;

  // Early bonus tier
  let earlyBonus = '';
  if (positionNumber <= 10) earlyBonus = 'Legendary (Top 10)';
  else if (positionNumber <= 50) earlyBonus = 'Epic (Top 50)';
  else if (positionNumber <= 100) earlyBonus = 'Rare (Top 100)';
  else if (positionNumber <= 500) earlyBonus = 'Early (Top 500)';
  else if (positionNumber <= 1000) earlyBonus = 'Anchor (Top 1000)';

  return {
    tokensReceived,
    avgPrice,
    totalCost: solAmount,
    priceImpact,
    positionNumber,
    potentialReturn,
    earlyBonus,
  };
}

/**
 * Calculate SOL received for selling tokens back to curve
 * Reverse of buy calculation
 */
export function calculateSellReturn(
  config: BondingCurveConfig,
  tokenAmount: number,
  avgBuyPrice: number
): SellQuote {
  const { basePrice, curveK, currentSupply } = config;

  if (tokenAmount > currentSupply) {
    throw new Error('Cannot sell more tokens than current supply');
  }

  const currentPrice = getCurrentPrice(config);
  const newSupply = currentSupply - tokenAmount;
  const newPrice = getPriceAtSupply(basePrice, curveK, newSupply);

  // SOL received (area under curve between old and new supply)
  // ∫[newSupply, currentSupply] P₀e^(kn)dn = (P₀/k)(e^(k×currentSupply) - e^(k×newSupply))
  const solReceived = (basePrice / curveK) * (
    Math.exp(curveK * currentSupply) - Math.exp(curveK * newSupply)
  );

  const avgSellPrice = solReceived / tokenAmount;
  const priceImpact = ((currentPrice - newPrice) / currentPrice) * 100;

  // Profit/loss calculation
  const costBasis = tokenAmount * avgBuyPrice;
  const profitLoss = solReceived - costBasis;

  return {
    solReceived,
    avgPrice: avgSellPrice,
    priceImpact,
    profitLoss,
  };
}

/**
 * Get full curve state with projections
 */
export function getCurveState(config: BondingCurveConfig): CurveState {
  const { basePrice, curveK, currentSupply } = config;
  const currentPrice = getCurrentPrice(config);

  // Calculate market cap (total SOL locked in curve)
  // ∫[0, currentSupply] P₀e^(kn)dn = (P₀/k)(e^(k×currentSupply) - 1)
  const marketCap = (basePrice / curveK) * (Math.exp(curveK * currentSupply) - 1);

  return {
    currentPrice,
    totalSupply: currentSupply,
    marketCap,
    priceAt100: getPriceAtSupply(basePrice, curveK, 100),
    priceAt1000: getPriceAtSupply(basePrice, curveK, 1000),
    priceAt10000: getPriceAtSupply(basePrice, curveK, 10000),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MARKET ANCHOR CALCULATIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Check if a buyer qualifies as a Market Anchor (first 5%)
 * Anchors earn 25% of all trading fees for the market lifetime
 */
export function isMarketAnchor(
  positionNumber: number,
  estimatedTotalParticipants: number = 1000
): boolean {
  const anchorThreshold = Math.ceil(estimatedTotalParticipants * 0.05);
  return positionNumber <= anchorThreshold;
}

/**
 * Calculate anchor's share of the fee pool
 */
export function calculateAnchorShare(
  buyerPositionSize: number,
  totalAnchorPoolSize: number
): number {
  if (totalAnchorPoolSize === 0) return 0;
  return buyerPositionSize / totalAnchorPoolSize;
}

/**
 * Calculate anchor rewards from collected fees
 */
export function calculateAnchorReward(
  anchorShare: number,
  totalFeesCollected: number,
  anchorPoolPercent: number = 0.25 // 25% goes to anchors
): number {
  const anchorPool = totalFeesCollected * anchorPoolPercent;
  return anchorPool * anchorShare;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SQUEEZE MECHANIC
// ═══════════════════════════════════════════════════════════════════════════════

interface SqueezeCheck {
  shouldSqueeze: boolean;
  divergence: number;           // % difference between Flex and Kalshi
  flexPrice: number;
  kalshiPrice: number;
  squeezeDirection: 'yes' | 'no' | null;
  burnAmount: number;           // Tokens to burn from opposing side
}

/**
 * Check if a squeeze should be triggered
 * Squeeze occurs when Flex sentiment diverges >20% from Kalshi institutional price
 */
export function checkSqueezeCondition(
  flexYesPrice: number,         // Current Flex YES token price
  kalshiYesPrice: number,       // Kalshi probability (0-1)
  totalFeesAvailable: number,   // Fees available for burn
  opposingSupply: number,       // NO token supply
  divergenceThreshold: number = 0.20 // 20% default
): SqueezeCheck {
  // Normalize Flex price to 0-1 range for comparison
  // This is approximate - in reality would need more sophisticated conversion
  const normalizedFlexPrice = Math.min(flexYesPrice, 1);

  const divergence = Math.abs(normalizedFlexPrice - kalshiYesPrice);
  const shouldSqueeze = divergence > divergenceThreshold;

  let squeezeDirection: 'yes' | 'no' | null = null;
  let burnAmount = 0;

  if (shouldSqueeze) {
    // Determine which side to squeeze (burn opposing tokens)
    squeezeDirection = normalizedFlexPrice > kalshiYesPrice ? 'yes' : 'no';

    // Use 50% of fees for burn
    const burnBudget = totalFeesAvailable * 0.5;

    // Calculate how many tokens to burn (simplified - would use curve math in production)
    burnAmount = burnBudget / flexYesPrice;
    burnAmount = Math.min(burnAmount, opposingSupply * 0.1); // Max 10% of supply
  }

  return {
    shouldSqueeze,
    divergence: divergence * 100, // as percentage
    flexPrice: flexYesPrice,
    kalshiPrice: kalshiYesPrice,
    squeezeDirection,
    burnAmount,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// RETURN PROJECTIONS (for UI display)
// ═══════════════════════════════════════════════════════════════════════════════

interface ReturnProjection {
  position: string;
  buyPrice: number;
  ifWin: string;          // Return multiplier if YES wins
  ifViralPump: string;    // Return if market pumps 10x before settlement
}

/**
 * Generate return projections for different entry points
 * Used for UI to show "Early = Big Returns" messaging
 */
export function getReturnProjections(
  basePrice: number = 0.001,
  curveK: number = 0.0001
): ReturnProjection[] {
  const redemptionPrice = 1.0; // $1 on win (normalized)

  const projections: ReturnProjection[] = [
    {
      position: 'First 10 buyers',
      buyPrice: getPriceAtSupply(basePrice, curveK, 5), // avg of first 10
      ifWin: '',
      ifViralPump: '',
    },
    {
      position: 'First 100 buyers',
      buyPrice: getPriceAtSupply(basePrice, curveK, 50),
      ifWin: '',
      ifViralPump: '',
    },
    {
      position: 'First 1,000 buyers',
      buyPrice: getPriceAtSupply(basePrice, curveK, 500),
      ifWin: '',
      ifViralPump: '',
    },
    {
      position: 'After 10,000 buyers',
      buyPrice: getPriceAtSupply(basePrice, curveK, 10000),
      ifWin: '',
      ifViralPump: '',
    },
  ];

  // Calculate returns
  for (const proj of projections) {
    const winReturn = redemptionPrice / proj.buyPrice;
    proj.ifWin = winReturn >= 1000 ? `${Math.floor(winReturn / 1000)}000x` :
                 winReturn >= 100 ? `${Math.floor(winReturn)}x` :
                 `${winReturn.toFixed(1)}x`;

    // Viral pump scenario (price goes 10x from their entry before settlement)
    const viralReturn = (proj.buyPrice * 10) / proj.buyPrice;
    proj.ifViralPump = `${viralReturn.toFixed(0)}x`;
  }

  return projections;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

export const DEFAULT_CURVE_CONFIG: Omit<BondingCurveConfig, 'currentSupply'> = {
  basePrice: 0.001,    // Start at 0.001 SOL (~$0.20 at $200/SOL)
  curveK: 0.0001,      // Gentle curve for smooth price discovery
};

/**
 * Create a new bonding curve config for a market
 */
export function createCurveConfig(
  overrides?: Partial<BondingCurveConfig>
): BondingCurveConfig {
  return {
    ...DEFAULT_CURVE_CONFIG,
    currentSupply: 0,
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE USAGE
// ═══════════════════════════════════════════════════════════════════════════════

/*
// Create a new market
const marketCurve = createCurveConfig();

// User wants to buy with 1 SOL
const buyQuote = calculateBuyTokens(marketCurve, 1);
console.log(`Tokens received: ${buyQuote.tokensReceived}`);
console.log(`Average price: ${buyQuote.avgPrice} SOL`);
console.log(`Position #: ${buyQuote.positionNumber}`);
console.log(`Potential return if WIN: ${buyQuote.potentialReturn}x`);
console.log(`Early bonus: ${buyQuote.earlyBonus}`);

// Update supply after purchase
marketCurve.currentSupply += buyQuote.tokensReceived;

// Check curve state
const state = getCurveState(marketCurve);
console.log(`Current price: ${state.currentPrice} SOL`);
console.log(`Market cap: ${state.marketCap} SOL`);

// Generate return projections for UI
const projections = getReturnProjections();
console.log('Return projections:');
projections.forEach(p => {
  console.log(`${p.position}: Buy at ${p.buyPrice.toFixed(6)} SOL, Win = ${p.ifWin}`);
});
*/

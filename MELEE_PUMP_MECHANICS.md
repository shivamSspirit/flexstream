# Melee Markets: TRUE Pump Mechanics Architecture
## Deep Research Analysis - January 2026

---

## The Key Insight

**Melee is NOT like Pump.fun for tokens. It's a hybrid of:**
- **Bonding Curve** (for price discovery)
- **Pari-Mutuel** (for settlement/payout)

This creates TWO ways to profit, which is the "pump" mechanic.

---

## How Melee's Prediction Market Pump Works

### 1. Market Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MELEE MARKET STRUCTURE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Each Market Has:                                                           │
│  ────────────────                                                           │
│  • Question: "Will Liverpool beat Newcastle?"                               │
│  • Multiple Outcomes: Liverpool (YES), Draw, Newcastle (NO)                │
│  • Each Outcome = Separate Bonding Curve                                   │
│  • All SOL goes into ONE shared pool                                       │
│                                                                             │
│       ┌──────────────┐    ┌──────────────┐    ┌──────────────┐            │
│       │  Liverpool   │    │    Draw      │    │  Newcastle   │            │
│       │   Curve      │    │   Curve      │    │    Curve     │            │
│       │  (64.2%)     │    │  (26.6%)     │    │   (9.2%)     │            │
│       └──────────────┘    └──────────────┘    └──────────────┘            │
│              │                   │                   │                     │
│              └───────────────────┴───────────────────┘                     │
│                              │                                             │
│                    ┌─────────▼─────────┐                                   │
│                    │   SHARED POOL     │                                   │
│                    │   (All SOL)       │                                   │
│                    │   1.32 SOL total  │                                   │
│                    └───────────────────┘                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2. The Bonding Curve (Price Discovery)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    BONDING CURVE PRICE MECHANISM                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Formula: Constant Product or Linear Bonding Curve                          │
│  ─────────────────────────────────────────────────                          │
│  As more people buy an outcome → Price increases                            │
│  As people sell → Price decreases                                          │
│                                                                             │
│  Example: "Liverpool" Outcome                                               │
│  ─────────────────────────────                                              │
│                                                                             │
│  Buyer #1:  Buys 100 shares at $0.01/share  = $1.00 cost                   │
│  Buyer #2:  Buys 100 shares at $0.03/share  = $3.00 cost                   │
│  Buyer #3:  Buys 100 shares at $0.08/share  = $8.00 cost                   │
│  Buyer #4:  Buys 100 shares at $0.15/share  = $15.00 cost                  │
│             ... curve keeps rising ...                                      │
│  Buyer #100: Buys 100 shares at $0.64/share = $64.00 cost                  │
│                                                                             │
│  SAME 100 shares, VERY different prices!                                   │
│  Early buyer: $0.01 per share                                              │
│  Late buyer:  $0.64 per share                                              │
│                                                                             │
│  This is the "PUMP" - price appreciation on the curve                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3. TWO Ways to Profit (The Secret Sauce)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    TWO PROFIT MECHANISMS                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PROFIT PATH 1: SELL ON CURVE (Before Settlement)                          │
│  ─────────────────────────────────────────────────                          │
│                                                                             │
│  • You bought Liverpool shares at $0.01                                    │
│  • Market goes viral, more people buy Liverpool                            │
│  • Price pumps to $0.50                                                    │
│  • You SELL your shares back to the curve                                  │
│  • Profit: 50x (regardless of match outcome!)                              │
│                                                                             │
│  This is like pump.fun - you profit from HYPE, not truth.                  │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  PROFIT PATH 2: HOLD TO SETTLEMENT (Pari-Mutuel)                           │
│  ──────────────────────────────────────────────                             │
│                                                                             │
│  • You hold your Liverpool shares until match ends                         │
│  • Liverpool WINS                                                           │
│  • All losing pools (Draw + Newcastle) are redistributed                   │
│  • Winners split the losers' money                                         │
│                                                                             │
│  Payout Formula:                                                            │
│  ───────────────                                                            │
│  Your Payout = (Total Pool / Total Winning Shares) × Your Shares           │
│                                                                             │
│  Example:                                                                   │
│  - Total Pool: 100 SOL                                                      │
│  - Liverpool Pool: 64 SOL (winning)                                        │
│  - Draw + Newcastle Pool: 36 SOL (losing)                                  │
│  - Total Liverpool Shares: 1000                                            │
│  - Your Shares: 100 (10%)                                                  │
│                                                                             │
│  Your Payout = 100 SOL × (100/1000) = 10 SOL                               │
│  Your Cost (early buyer): 1 SOL                                            │
│  Your Profit: 9 SOL (9x return)                                            │
│                                                                             │
│  BUT if you were a LATE buyer (paid 6.4 SOL for same shares):              │
│  Your Payout: 10 SOL, Your Cost: 6.4 SOL                                   │
│  Your Profit: 3.6 SOL (0.56x return)                                       │
│                                                                             │
│  EARLY BUYERS GET BETTER RETURNS EVEN IN SETTLEMENT!                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4. The 100x Return Scenario

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    HOW 100x RETURNS HAPPEN                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Scenario: Underdog Market Goes Viral                                       │
│  ────────────────────────────────────                                       │
│                                                                             │
│  1. Market Created: "Will obscure crypto hit $1B market cap?"              │
│     - Initially, few people care                                            │
│     - YES price starts at $0.001                                           │
│                                                                             │
│  2. You (Early Believer) Buy:                                               │
│     - 1000 YES shares at $0.001 = 1 SOL cost                               │
│                                                                             │
│  3. Influencer Tweets About It:                                             │
│     - Market goes viral on X                                                │
│     - 10,000 people rush to buy YES                                        │
│     - Bonding curve pumps price to $0.50                                   │
│                                                                             │
│  4. EXIT OPTION A - Sell on Curve:                                         │
│     - Sell 1000 shares at $0.50 each                                       │
│     - Receive: 500 SOL                                                      │
│     - Cost: 1 SOL                                                          │
│     - PROFIT: 499 SOL (500x!)                                              │
│                                                                             │
│  5. EXIT OPTION B - Wait for Settlement:                                   │
│     - If YES wins: Get share of ~100+ SOL pool                             │
│     - Early shares = bigger % of pool                                      │
│     - Could be 10-100x depending on pool size                              │
│                                                                             │
│  THE "PUMP" IS THE BONDING CURVE PRICE APPRECIATION                        │
│  NOT the settlement payout!                                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Technical Architecture

### 5. Smart Contract Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MELEE SMART CONTRACT ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Market Account (PDA):                                                      │
│  ─────────────────────                                                      │
│  {                                                                          │
│    id: "market_123",                                                        │
│    question: "Liverpool vs Newcastle Winner",                               │
│    creator: "wallet_address",                                               │
│    creatorFee: 20%, // Creator earns 20% of trading fees                   │
│                                                                             │
│    outcomes: [                                                              │
│      {                                                                      │
│        name: "Liverpool",                                                   │
│        bondingCurve: {                                                      │
│          virtualSolReserves: 30_000_000_000, // 30 SOL virtual             │
│          virtualTokenReserves: 1_000_000_000, // 1B tokens virtual         │
│          realSolReserves: 850_000_000, // 0.85 SOL real                    │
│          realTokenReserves: 640_000_000, // 640M tokens sold               │
│        },                                                                   │
│        totalShares: 640_000_000,                                           │
│      },                                                                     │
│      {                                                                      │
│        name: "Draw",                                                        │
│        bondingCurve: { ... },                                              │
│        totalShares: 266_000_000,                                           │
│      },                                                                     │
│      {                                                                      │
│        name: "Newcastle",                                                   │
│        bondingCurve: { ... },                                              │
│        totalShares: 92_000_000,                                            │
│      }                                                                      │
│    ],                                                                       │
│                                                                             │
│    totalPool: 1_320_000_000, // 1.32 SOL total                             │
│    status: "live", // live | pending_resolution | resolved                 │
│    winningOutcome: null, // Set when resolved                              │
│    resolutionTime: "2026-01-31T00:00:00Z",                                 │
│  }                                                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6. Buy Function (Bonding Curve)

```typescript
// Melee-style buy function
function buyOutcomeShares(
  marketId: string,
  outcomeIndex: number, // 0 = Liverpool, 1 = Draw, 2 = Newcastle
  solAmount: number
): BuyResult {
  const market = getMarket(marketId);
  const outcome = market.outcomes[outcomeIndex];
  const curve = outcome.bondingCurve;

  // Constant Product Formula: x * y = k
  // price = virtualSolReserves / virtualTokenReserves

  const currentPrice = curve.virtualSolReserves / curve.virtualTokenReserves;

  // Calculate shares received
  // shares = virtualTokenReserves - (k / (virtualSolReserves + solAmount))
  const k = curve.virtualSolReserves * curve.virtualTokenReserves;
  const newVirtualSol = curve.virtualSolReserves + solAmount;
  const newVirtualTokens = k / newVirtualSol;
  const sharesReceived = curve.virtualTokenReserves - newVirtualTokens;

  // Update curve state
  curve.virtualSolReserves = newVirtualSol;
  curve.virtualTokenReserves = newVirtualTokens;
  curve.realSolReserves += solAmount;
  curve.realTokenReserves -= sharesReceived;

  // Update total pool (ALL outcomes contribute to shared pool)
  market.totalPool += solAmount;

  // Take fees
  const tradingFee = solAmount * 0.02; // 2% fee
  const creatorFee = tradingFee * market.creatorFee; // 20% to creator
  const protocolFee = tradingFee - creatorFee; // 80% to protocol

  return {
    sharesReceived,
    avgPrice: solAmount / sharesReceived,
    newPrice: curve.virtualSolReserves / curve.virtualTokenReserves,
    priceImpact: ((newPrice - currentPrice) / currentPrice) * 100,
  };
}
```

### 7. Sell Function (Exit Before Settlement)

```typescript
// Sell shares back to bonding curve (THE PUMP EXIT)
function sellOutcomeShares(
  marketId: string,
  outcomeIndex: number,
  sharesToSell: number
): SellResult {
  const market = getMarket(marketId);
  const outcome = market.outcomes[outcomeIndex];
  const curve = outcome.bondingCurve;

  // Reverse of buy - calculate SOL received
  const k = curve.virtualSolReserves * curve.virtualTokenReserves;
  const newVirtualTokens = curve.virtualTokenReserves + sharesToSell;
  const newVirtualSol = k / newVirtualTokens;
  const solReceived = curve.virtualSolReserves - newVirtualSol;

  // Update curve state
  curve.virtualSolReserves = newVirtualSol;
  curve.virtualTokenReserves = newVirtualTokens;
  curve.realSolReserves -= solReceived;
  curve.realTokenReserves += sharesToSell;

  // Update total pool
  market.totalPool -= solReceived;

  return {
    solReceived,
    avgPrice: solReceived / sharesToSell,
    newPrice: curve.virtualSolReserves / curve.virtualTokenReserves,
  };
}
```

### 8. Settlement Function (Pari-Mutuel Payout)

```typescript
// Settle market and distribute winnings
function settleMarket(
  marketId: string,
  winningOutcomeIndex: number
): SettlementResult {
  const market = getMarket(marketId);
  market.winningOutcome = winningOutcomeIndex;
  market.status = 'resolved';

  const winningOutcome = market.outcomes[winningOutcomeIndex];
  const totalPool = market.totalPool;
  const totalWinningShares = winningOutcome.totalShares;

  // Payout per share = Total Pool / Total Winning Shares
  const payoutPerShare = totalPool / totalWinningShares;

  // Each winner claims: payoutPerShare × theirShares
  // Losers get nothing (their SOL goes to winners)

  return {
    winningOutcome: winningOutcome.name,
    totalPool,
    totalWinningShares,
    payoutPerShare,
    // Winner with 1000 shares gets: 1000 × payoutPerShare
  };
}
```

---

## Key Differences from Pump.fun

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MELEE vs PUMP.FUN COMPARISON                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Aspect              │ Pump.fun              │ Melee Markets                │
│  ────────────────────┼───────────────────────┼──────────────────────────────│
│  Asset Type          │ Meme Token            │ Prediction Outcome Shares    │
│  Outcomes            │ 1 token               │ Multiple (YES/NO/etc)        │
│  Settlement          │ None (trade forever)  │ Pari-mutuel at resolution    │
│  Migration           │ To Raydium at $69K    │ No migration needed          │
│  Exit Options        │ Sell on curve only    │ Sell on curve OR settlement  │
│  Winner/Loser        │ No concept            │ Winners take losers' pool    │
│  Price Cap           │ None (can moon)       │ Capped by pari-mutuel math   │
│  Creator Fees        │ Not built-in          │ Up to 20% of trading fees    │
│                                                                             │
│  SHARED:                                                                    │
│  • Bonding curve for price discovery                                       │
│  • Early buyers get better prices                                          │
│  • Can sell anytime before settlement/migration                            │
│  • Permissionless creation                                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Summary: The TRUE Melee Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MELEE'S PUMP MECHANIC SUMMARY                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. BONDING CURVE LAYER (Price Discovery)                                  │
│     • Each outcome has its own curve                                       │
│     • Constant product formula (like Uniswap)                              │
│     • Price rises as more people buy                                       │
│     • Early buyers get more shares per SOL                                 │
│                                                                             │
│  2. SHARED POOL LAYER (Pari-Mutuel Settlement)                             │
│     • ALL SOL from ALL outcomes goes to one pool                           │
│     • When market resolves, winners split entire pool                      │
│     • Losers get $0                                                        │
│     • More shares = bigger slice of pool                                   │
│                                                                             │
│  3. THE "PUMP" = Bonding Curve Price Appreciation                          │
│     • NOT related to settlement                                            │
│     • Happens when market goes viral                                       │
│     • Early buyer sells at higher price                                    │
│     • Can happen regardless of outcome                                     │
│                                                                             │
│  4. TWO PROFIT PATHS                                                       │
│     Path A: Sell on curve (pump profit)                                    │
│     Path B: Hold to settlement (pari-mutuel profit)                        │
│                                                                             │
│  5. WHY 100x IS POSSIBLE                                                   │
│     • Buy at $0.001, price pumps to $0.10 = 100x                          │
│     • OR: Buy at $0.001, win share of big pool = 100x                     │
│     • BOTH can compound if you're early AND right                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Sources

- [CoinDesk: Melee Raises $3.5M](https://www.coindesk.com/business/2025/09/24/melee-raises-usd3-5m-to-launch-viral-prediction-markets-without-gatekeepers)
- [Variant Fund: Investing in Melee](https://blog.variant.fund/investing-in-melee-markets-permissionless-prediction-markets-with-uncapped-upside)
- [Messari: Melee Markets Profile](https://messari.io/project/melee-markets/profile)
- [DWF Labs: Prediction Markets 2025](https://www.dwf-labs.com/research/prediction-markets-in-2025-from-niche-bets-to-mainstream-forecast-infrastructure)
- [ChainCatcher: Melee Analysis](https://www.chaincatcher.com/en/article/2208752)

---

*Research compiled January 2026*

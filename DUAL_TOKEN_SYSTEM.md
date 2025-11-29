# Dual Token System - Post & Creator Tokens

FlexIt supports **two types of tradable tokens**, each with separate pool configurations for optimal flexibility.

---

## 🎯 **Token Types**

### **1. Post-Level Tokens** 🎨
Each post gets its own unique tradable token.

**Use Case:**
- Share a flex, trade, or achievement
- Launch a token for that specific content
- Users trade based on the post's popularity

**Configuration:**
```env
POST_POOL_CONFIG_KEY=9UptFKwss3uPQQWF8giDz6yEYVzB9cvdrYWDeFoWYvF1
```

**Settings:**
- **Supply:** 1 billion tokens per post
- **Fees:** 0% (no creator fees)
- **Config:** Optimized for viral content
- **Lifecycle:** Tied to individual posts

---

### **2. Creator-Level Tokens** ⭐
Each creator has their own profile token.

**Use Case:**
- Creator's personal brand token
- Represents the creator's overall value
- Long-term holder engagement
- Premium access & perks

**Configuration:**
```env
CREATOR_POOL_CONFIG_KEY=41MgtuAEUZ6wSmnheX5vkSPFjWVSfVcGebgSJjQwVXZp
```

**Settings:**
- **Supply:** 10 billion tokens per creator (higher supply)
- **Fees:** 1% creator fee (revenue share)
- **Config:** Optimized for long-term growth
- **Lifecycle:** Permanent, tied to creator profile

---

## 📊 **Comparison**

| Feature | Post Tokens | Creator Tokens |
|---------|-------------|----------------|
| **Quantity** | Unlimited (one per post) | One per creator |
| **Supply** | 1B tokens | 10B tokens |
| **Creator Fee** | 0% | 1% |
| **Purpose** | Content virality | Creator brand value |
| **Lifecycle** | Per post | Permanent |
| **Trading** | Short-term speculation | Long-term holding |
| **Config Key** | `POST_POOL_CONFIG_KEY` | `CREATOR_POOL_CONFIG_KEY` |

---

## 🔧 **Configuration**

### **Environment Variables**

```env
# ═══════════════════════════════════════════════════════════
# METEORA DBC CONFIGURATION (Dual Token System)
# ═══════════════════════════════════════════════════════════

# Platform keypair - pays fees for ALL token creation
PLATFORM_KEYPAIR_SECRET=your_keypair_secret_here

# Post-level tokens (one per post)
POST_POOL_CONFIG_KEY=9UptFKwss3uPQQWF8giDz6yEYVzB9cvdrYWDeFoWYvF1

# Creator-level tokens (one per creator)
CREATOR_POOL_CONFIG_KEY=41MgtuAEUZ6wSmnheX5vkSPFjWVSfVcGebgSJjQwVXZp

# Network settings
NEXT_PUBLIC_METEORA_NETWORK=devnet
NEXT_PUBLIC_METEORA_RPC_URL=https://api.devnet.solana.com
```

---

## 💻 **Code Implementation**

### **Creating Post Tokens**

```typescript
import { MeteoraDBCClient } from '@/lib/meteora-dbc';

const dbcClient = new MeteoraDBCClient(connection);

// Create post token
const result = await dbcClient.createToken({
  name: "My Awesome Post",
  symbol: "POST1",
  description: "Check out this flex!",
  imageUri: metadataUri,
  tokenType: 'post', // ← POST token
});

console.log('Post token created:', result.mint.toBase58());
// Uses POST_POOL_CONFIG_KEY
// 1B supply, 0% fees
```

### **Creating Creator Tokens**

```typescript
import { MeteoraDBCClient } from '@/lib/meteora-dbc';

const dbcClient = new MeteoraDBCClient(connection);

// Create creator token
const result = await dbcClient.createToken({
  name: "@username",
  symbol: "USER",
  description: "Creator token for @username",
  imageUri: profileImageUri,
  tokenType: 'creator', // ← CREATOR token
});

console.log('Creator token created:', result.mint.toBase58());
// Uses CREATOR_POOL_CONFIG_KEY
// 10B supply, 1% creator fees
```

---

## 🎨 **Token Configuration Details**

### **Post Token Config**

Located in: `lib/dbc-config.ts`

```typescript
export const POST_TOKEN_CONFIG = {
  PROGRAM_ID: new PublicKey('dbcij3LWUppWqq96dh6gJWwBifmcGfLSB5D4DuSMaqN'),
  CONFIG_KEY: new PublicKey(process.env.POST_POOL_CONFIG_KEY),
  TYPE: 'post',
  DEFAULT_INITIAL_SUPPLY: 1_000_000_000, // 1B
  DEFAULT_FEE_BPS: 0, // 0%
};
```

**Why these settings?**
- **1B Supply**: Enough for viral trading, not too diluted
- **0% Fees**: Maximum accessibility, no barriers to trade
- **Fast Trading**: Optimized for quick speculation on content

---

### **Creator Token Config**

Located in: `lib/dbc-config.ts`

```typescript
export const CREATOR_TOKEN_CONFIG = {
  PROGRAM_ID: new PublicKey('dbcij3LWUppWqq96dh6gJWwBifmcGfLSB5D4DuSMaqN'),
  CONFIG_KEY: new PublicKey(process.env.CREATOR_POOL_CONFIG_KEY),
  TYPE: 'creator',
  DEFAULT_INITIAL_SUPPLY: 10_000_000_000, // 10B
  DEFAULT_FEE_BPS: 100, // 1%
};
```

**Why these settings?**
- **10B Supply**: Large supply for sustainable long-term growth
- **1% Fees**: Revenue share for creators on all trades
- **Long-term Value**: Designed for holding, not flipping

---

## 🚀 **Use Cases**

### **Post Tokens - Examples**

1. **Viral Flex**: "Just hit 100x on $SOL!"
   - Post goes viral
   - Post token surges
   - Traders speculate on virality
   - Short-term trading frenzy

2. **Alpha Call**: "New gem launching soon 👀"
   - Share alpha through post
   - Post token = access to alpha
   - Early buyers profit if alpha is good

3. **Achievement**: "Won trading competition!"
   - Celebrate milestone with post
   - Post token commemorates achievement
   - Collectors buy to support

---

### **Creator Tokens - Examples**

1. **Premium Access**
   - Hold X amount of creator token
   - Unlock exclusive content
   - Private Discord/Telegram access
   - Early alpha calls

2. **Revenue Sharing**
   - Creator earns 1% on all trades
   - More trades = more revenue
   - Sustainable creator income

3. **Governance**
   - Token holders vote on content
   - Community-driven direction
   - Stronger creator-fan relationship

---

## 🔄 **Token Lifecycle**

### **Post Token Lifecycle**

```
1. User creates post
   ↓
2. Platform creates post token automatically
   ↓
3. Token becomes tradable immediately
   ↓
4. Trading volume increases with post virality
   ↓
5. Token value tied to post engagement
```

### **Creator Token Lifecycle**

```
1. Creator joins platform
   ↓
2. Platform creates creator token (optional)
   ↓
3. Token grows with creator's reputation
   ↓
4. Long-term holders get perks
   ↓
5. Creator earns from trading fees
   ↓
6. Token becomes creator's equity
```

---

## 💰 **Economics**

### **Post Tokens**

**Revenue Model:**
- No creator fees (0%)
- Platform can charge platform fee separately
- Focus on volume and virality

**Trading Dynamics:**
- High volatility
- Short-term speculation
- Tied to content performance
- Quick price discovery

---

### **Creator Tokens**

**Revenue Model:**
- 1% creator fee on all trades
- Creator earns passive income
- Sustainable long-term revenue
- Incentivizes quality content

**Trading Dynamics:**
- Lower volatility
- Long-term holding
- Tied to creator reputation
- Gradual price appreciation

---

## 🛠️ **Implementation Status**

### ✅ **Completed**

- [x] Dual config system in `dbc-config.ts`
- [x] Token type parameter in `createToken()`
- [x] Automatic config selection
- [x] Post token creation in `/api/posts/create`
- [x] Backend-only token creation (no user signatures)
- [x] Environment variable setup

### 🔄 **To Implement**

- [ ] Creator token creation API endpoint
- [ ] Creator profile page token display
- [ ] Token holder perks/access system
- [ ] Creator revenue dashboard
- [ ] Token analytics & charts
- [ ] Trading interface for both token types

---

## 📖 **Developer Guide**

### **Creating Post Tokens (Automatic)**

Post tokens are created automatically when a user creates a post:

```typescript
// app/api/posts/create/route.ts

const tokenResult = await dbcClient.createToken({
  name: title,
  symbol: ticker,
  description: content,
  imageUri: metadataUri,
  tokenType: 'post', // ← Automatic post token
});

// Returns: mint, pool, signature
// Uses POST_POOL_CONFIG_KEY automatically
```

### **Creating Creator Tokens (On-Demand)**

Creator tokens can be created when a user verifies or reaches a milestone:

```typescript
// Example: app/api/creators/create-token/route.ts

const tokenResult = await dbcClient.createToken({
  name: creator.displayName,
  symbol: `@${creator.username}`,
  description: creator.bio,
  imageUri: creator.avatarUrl,
  tokenType: 'creator', // ← Creator token
});

// Returns: mint, pool, signature
// Uses CREATOR_POOL_CONFIG_KEY automatically
```

---

## 🔐 **Security Considerations**

### **Both Token Types**

- Platform keypair signs all transactions
- No user signature required
- Platform pays all fees
- Transactions are atomic
- On-chain verification

### **Post Tokens**

- Spam prevention recommended
- Rate limiting per user
- Minimum content quality requirements

### **Creator Tokens**

- One per creator (enforce in DB)
- Require verification before creation
- Higher barrier to entry
- More valuable, more protection

---

## 🎯 **Best Practices**

### **When to Use Post Tokens**

✅ Every post gets a token automatically
✅ Great for viral content
✅ Quick speculation
✅ Short-term engagement

### **When to Use Creator Tokens**

✅ Verified creators only
✅ Long-term community building
✅ Premium content access
✅ Sustainable creator economy

---

## 📚 **Resources**

- **Meteora DBC Docs**: https://docs.meteora.ag/developer-guide/guides/dbc/overview
- **Pool Config Guide**: https://docs.meteora.ag/developer-guide/guides/dbc/bonding-curve-configs
- **SDK Reference**: https://docs.meteora.ag/developer-guide/guides/dbc/typescript-sdk/sdk-functions

---

**Your dual token system is ready!** 🎉

Post tokens for viral content, creator tokens for long-term value. Both automated, both on-chain, both tradable.

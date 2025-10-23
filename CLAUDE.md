# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FlexStream is a social media platform for crypto traders and pump.fun streamers built with Next.js 14 (App Router), TypeScript, Supabase, and Solana blockchain integration. The platform allows users to create posts that automatically generate tradable tokens via Meteora's Dynamic Bonding Curve (DBC) protocol.

## Development Commands

### Basic Commands
```bash
# Install dependencies (uses pnpm)
pnpm install

# Run development server (default port 3000)
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Lint code
pnpm lint

# Generate Supabase types
pnpm db:generate
```

### Environment Setup
Before running the app, copy `env.example` to `.env.local` and configure:
- Supabase credentials (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL)
- Solana RPC endpoint (NEXT_PUBLIC_SOLANA_RPC_URL, defaults to mainnet)
- Clerk authentication keys (NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY)
- Uploadthing credentials (UPLOADTHING_SECRET, UPLOADTHING_APP_ID)
- Meteora DBC config (POOL_CONFIG_KEY, DBC_CREATOR_PRIVATE_KEY)
- Privy authentication (NEXT_PUBLIC_PRIVY_APP_ID, PRIVY_APP_SECRET)

Run `node scripts/check-env.js` to verify your configuration.

## Architecture

### Authentication System
FlexStream uses a **dual authentication model**:
1. **Clerk** handles traditional auth (email/social login) and user identity
2. **Solana Wallet Adapter** manages blockchain wallet connections (Phantom, Solflare, Jupiter, etc.)

Both authentications are required for full functionality. The user flow is:
- User signs in via Clerk → Gets JWT token and user session
- User connects Solana wallet → Wallet address linked to Clerk user (1:1 mapping)
- Trading/token operations require both authentications

### Provider Hierarchy
The app uses a nested provider structure in `app/layout.tsx`:
```
ClerkProvider
  └─ Providers (React Query)
      └─ SolanaProvider (Wallet adapters + ConnectionProvider)
          └─ App components
```

This order is critical - changing it will break authentication flows.

### Database Layer (Supabase)
Main tables:
- `users` - User profiles with wallet addresses, success tiers, follower counts
- `posts` - Social posts with token metadata (token_mint, pool_address, bonding_curve_address)
- `tokens` - Dedicated token tracking table with DBC pool info
- `follows`, `likes`, `comments`, `notifications` - Social graph
- `earnings_verifications` - Blockchain-verified earnings

Database types are defined in `lib/supabase.ts` and should be kept in sync with actual schema.

### Token Creation Flow (Meteora DBC Integration)
When users create a post, a token is automatically created via Meteora DBC:

1. **Frontend**: `components/posts/CreatePostModal.tsx` collects post data (title, ticker, description, media)
2. **API Route**: `app/api/posts/create/route.ts` orchestrates the creation:
   - Uploads media to Supabase Storage
   - Uploads token metadata to IPFS/Arweave
   - Calls `MeteoraDBCClient.createToken()` from `lib/meteora-dbc.ts`
   - Creates DBC pool and token mint in single transaction
   - Saves post and token data to database
3. **User signs transaction** in their Solana wallet
4. **Transaction confirmation** on Solana blockchain

Key files:
- `lib/meteora-dbc.ts` - Main DBC client implementation
- `lib/dbc-config.ts` - Configuration constants
- `hooks/useCreateToken.ts` - React hook for token creation
- `lib/idl/dbc.ts` - Meteora DBC program IDL

### API Routes
API routes follow Next.js 14 App Router conventions (`app/api/*/route.ts`).

Important routes:
- `/api/posts/create` - Create post with token
- `/api/dbc/*` - DBC operations (create-token, pool-info, buy, sell)
- `/api/upload` - Media upload handling
- `/api/pump-fun/*` - Pump.fun API integration for live streams
- `/api/auth/*` - Wallet linking and JWT generation

### Component Organization
- `components/layout/` - Layout components (MinimalSidebar, UniversalHeader, MobileNav)
- `components/posts/` - Post-related components (PostCard, CreatePostModal, CreatePostForm)
- `components/feed/` - Feed components (SimpleFeed, MainFeed, FeedFilters)
- `components/pump-fun/` - Live stream components
- `components/solana/` - Solana wallet provider
- `components/ui/` - Shadcn/ui base components (radix-ui based)

### State Management
- **React Query** (`@tanstack/react-query`) for server state (queries cached for 60s, retry once)
- **Zustand** for client state (if needed)
- **React Hook Form + Zod** for form state and validation

### Styling System
- **Tailwind CSS** with custom design tokens
- **Shadcn/ui** components (Radix UI primitives + Tailwind)
- **Dark theme by default** (set in root HTML element)
- Custom color palette: Purple/Pink gradients for primary, dark backgrounds (#0a0a0a, #1a1a1a)

CSS custom properties defined in `app/globals.css`. Always use Tailwind classes, not inline styles.

## Key Patterns

### Wallet Connection Pattern
```typescript
import { useWallet } from '@solana/wallet-adapter-react';
import { useAuth } from '@clerk/nextjs';

// Check both auth states
const { isSignedIn } = useAuth();
const { connected, publicKey } = useWallet();
const isFullyAuthenticated = isSignedIn && connected;
```

### Supabase Query Pattern
```typescript
import { supabase } from '@/lib/supabase';

// Always check if client exists (may be null without env vars)
if (!supabase) {
  throw new Error('Supabase not configured');
}

const { data, error } = await supabase
  .from('posts')
  .select('*')
  .order('created_at', { ascending: false });
```

### DBC Token Creation Pattern
```typescript
import { MeteoraDBCClient } from '@/lib/meteora-dbc';
import { Connection } from '@solana/web3.js';

const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!);
const dbcClient = new MeteoraDBCClient(connection);

const result = await dbcClient.createToken({
  name: 'My Token',
  symbol: 'MTK',
  description: 'Token description',
  imageUri: 'https://example.com/image.png',
  creator: publicKey,
  initialSupply: 1_000_000_000
});
```

## TypeScript Configuration

- **Strict mode enabled** - All types must be properly defined
- **Path aliases** configured in `tsconfig.json`:
  - `@/*` → project root
  - `@/components/*` → `./components/*`
  - `@/lib/*` → `./lib/*`
  - `@/hooks/*` → `./hooks/*`

Use path aliases consistently instead of relative imports.

## Build Configuration

### Next.js Config (`next.config.js`)
- **Image domains whitelisted**: Supabase, Uploadthing, IPFS, GitHub avatars, pump.mypinata.cloud
- **Webpack externals** for Solana libraries to reduce bundle size
- **Fallbacks** for Node.js modules (fs, net, tls)
- **ESLint and TypeScript errors block builds** (not ignored)

### Deployment
- **Target platform**: Vercel
- **Node version**: Managed by Vercel config
- Set all environment variables in Vercel dashboard before deploying

## Database Migrations

Migrations are in `supabase/migrations/`:
- `001_initial_schema.sql` - Core tables (users, posts, follows, likes, comments, notifications)
- `002_add_wallet_fields.sql` - Wallet-related fields (encrypted_private_key, wallet_created_at, clerk_user_id)
- `20231016_add_token_fields.sql` - Token fields on posts table
- `add_dbc_token_support.sql` - Dedicated tokens table with DBC pool info

When modifying schema, create new migration files and run via Supabase CLI or dashboard.

## Common Development Tasks

### Adding a New API Route
1. Create `app/api/[name]/route.ts`
2. Export named functions: `GET`, `POST`, `PUT`, `DELETE`
3. Return `NextResponse.json()` from handlers
4. Always validate inputs with Zod schemas

### Adding a New Page
1. Create `app/[name]/page.tsx`
2. Use `export default function` (must be default export)
3. Wrap client components in `'use client'` directive if using hooks/state
4. Use layouts (`app/[name]/layout.tsx`) for shared UI

### Creating a Shadcn Component
```bash
# Components are manually created following Shadcn patterns
# Base components are in components/ui/
# Use Radix UI primitives + Tailwind + class-variance-authority
```

### Testing DBC Token Creation
1. Ensure `.env.local` has all required variables
2. Connect wallet in browser
3. Navigate to `/create`
4. Fill form and submit
5. Sign transaction in wallet
6. Verify on Solana Explorer and Jupiter/Meteora

## Important Notes

- **Never commit `.env.local`** - Use `env.example` as template
- **Post creation requires both Clerk auth AND wallet connection** - Check both before enabling UI
- **DBC token creation is on mainnet by default** - Use devnet RPC for testing
- **Supabase client may be null** - Always check before using
- **Media uploads go to Supabase Storage OR Uploadthing** - Depends on configuration
- **Transaction signing happens client-side** - Never store private keys on server
- **Package manager is pnpm** - Don't use npm/yarn

## External Services

- **Clerk**: User authentication and management
- **Supabase**: PostgreSQL database with real-time subscriptions
- **Uploadthing**: File uploads (alternative to Supabase Storage)
- **Meteora**: DBC protocol for token launches
- **Solana**: Blockchain for token creation and trading
- **Jupiter**: DEX aggregator for trading
- **Helius** (optional): Enhanced Solana RPC

## Troubleshooting

### "Supabase not configured" errors
Check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in `.env.local`.

### Wallet connection issues
1. Check browser console for errors
2. Verify `NEXT_PUBLIC_SOLANA_RPC_URL` is accessible
3. Ensure wallet extension is installed and unlocked
4. Try disconnecting and reconnecting

### Token creation fails
1. Verify all DBC environment variables are set
2. Check wallet has SOL for transaction fees
3. Check Solana RPC endpoint is responding
4. Review transaction error in wallet

### Build errors
1. Run `pnpm lint` to check for linting issues
2. Run TypeScript check: `npx tsc --noEmit`
3. Clear `.next` folder and rebuild
4. Verify all dependencies are installed with `pnpm install`

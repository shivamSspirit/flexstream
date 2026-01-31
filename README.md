# FlexStream

A social trading platform on Solana where every post becomes a tradeable token.

## What It Does

- **Post = Token**: When a creator posts content, a tradeable token (1B supply) is automatically created via Meteora DBC
- **Creator Coins**: Creators can also launch their own profile-level token (1B supply)
- **Zero Cost**: Platform wallet pays all token creation fees (~$3) so creators post for free
- **Prediction Markets**: Kalshi-style prediction market integration for crypto/politics/economics
- **Real-time Trading**: Jupiter-powered swaps with best execution routing

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS + Shadcn/ui |
| Database | Supabase (PostgreSQL + Realtime) |
| Auth | Privy (embedded wallets + social login) |
| Blockchain | Solana Devnet |
| Token Creation | Meteora Dynamic Bonding Curve SDK |
| Swaps | Jupiter Aggregator API |
| RPC | Helius |
| State | React Query + Zustand |
| Deployment | Vercel |

## Project Structure

```
flexstream/
├── app/                    # Next.js App Router
│   ├── api/               # 20+ API routes
│   │   ├── auth/          # Privy authentication
│   │   ├── creators/      # Creator coin activation
│   │   ├── dbc/           # Meteora DBC operations
│   │   ├── posts/         # Post CRUD + token creation
│   │   ├── predictions/   # Prediction market endpoints
│   │   ├── swap/          # Jupiter swap integration
│   │   └── tokens/        # Token operations
│   ├── dashboard/         # User dashboard
│   ├── explore/           # Discovery feed
│   ├── predictions/       # Prediction markets UI
│   ├── profile/           # User profiles
│   └── settings/          # User settings
├── components/            # React components
├── db/                    # SQL migrations (25+)
├── hooks/                 # Custom React hooks
├── lib/                   # Core logic
│   ├── meteora-dbc.ts    # Token creation via DBC
│   ├── dbc-config.ts     # DBC configuration
│   └── services/         # Business logic services
├── scripts/              # Utility scripts
└── types/                # TypeScript definitions
```

## Quick Start

```bash
# Install dependencies
pnpm install

# Set up environment (copy and fill in values)
cp env.example .env.local

# Start dev server
pnpm dev
```

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Privy
NEXT_PUBLIC_PRIVY_APP_ID=
PRIVY_APP_SECRET=

# Solana (DEVNET ONLY)
NEXT_PUBLIC_HELIUS_RPC_URL=
PLATFORM_KEYPAIR_SECRET=

# Jupiter
JUPITER_REFERRAL_ACCOUNT=

# Optional
BIRDEYE_API_KEY=
```

## Key Commands

```bash
pnpm dev          # Start development server
pnpm build        # Production build
pnpm lint         # Run ESLint
pnpm lint --fix   # Auto-fix lint issues
```

## Architecture Notes

- **Server-side blockchain**: All Solana operations run in API routes, never client-side
- **Platform keypair**: Single wallet pays all token creation fees
- **Devnet only**: All blockchain operations are on Solana devnet
- **Real-time feeds**: Supabase subscriptions for live post/price updates
- **RLS enabled**: Row-level security on all database tables

## API Routes

| Route | Purpose |
|-------|---------|
| `/api/posts/create` | Create post + auto-mint token |
| `/api/creators/activate-coin` | Launch creator token |
| `/api/swap/*` | Jupiter swap operations |
| `/api/predictions/*` | Prediction market data |
| `/api/users/*` | User profile operations |

## License

MIT

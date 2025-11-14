# CLAUDE.md - FlexStream Developer Guide for AI Assistants

> **Last Updated:** 2025-11-14
> **Project:** FlexStream (FlexIt)
> **Version:** 0.1.0

## Table of Contents
1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Architecture Overview](#architecture-overview)
4. [Directory Structure](#directory-structure)
5. [Development Workflow](#development-workflow)
6. [Key Patterns & Conventions](#key-patterns--conventions)
7. [Database Schema](#database-schema)
8. [API Conventions](#api-conventions)
9. [Component Patterns](#component-patterns)
10. [State Management](#state-management)
11. [Common Tasks](#common-tasks)
12. [Environment Setup](#environment-setup)
13. [Deployment](#deployment)
14. [Troubleshooting](#troubleshooting)
15. [AI Assistant Guidelines](#ai-assistant-guidelines)

---

## Project Overview

**FlexStream** (also branded as **FlexIt**) is a Solana-native social platform that enables crypto traders and streamers to showcase their success by creating posts that automatically mint tradable tokens using Meteora's Dynamic Bonding Curve (DBC) protocol.

### Core Value Proposition
- **Every post can mint a free, tradable token** on Solana
- **Verified creator reputation** linked to wallets and Twitter
- **Dual-token economics** for profile and post-level assets
- **Private token-gated copy trading** to protect strategies
- **Multiple monetization channels**: subscriptions, tipping, trading fees

### Current Status
- Beta on Solana **DevNet** (can be switched to MainNet)
- ~97 TypeScript/React files
- Full-stack Next.js application with Supabase backend

---

## Tech Stack

### Frontend
- **Framework:** Next.js 14.2.25 (App Router)
- **Language:** TypeScript 5 (strict mode enabled)
- **UI Library:** React 18
- **Styling:** Tailwind CSS 3.3 with custom Zora-inspired design system
- **UI Components:** Radix UI primitives (shadcn/ui patterns)
- **State Management:**
  - React Query (@tanstack/react-query) for server state
  - React hooks for local state
  - Zustand installed but not actively used
- **Forms:** React Hook Form + Zod validation
- **Animations:** Framer Motion
- **Notifications:** Sonner (toast library)

### Blockchain
- **Network:** Solana (DevNet/MainNet configurable)
- **Wallet:** Jupiter Wallet Adapter (UnifiedWalletProvider)
- **Web3 Library:** @solana/web3.js v1.98.4
- **Token Standard:** SPL Token
- **DBC Protocol:** Meteora Dynamic Bonding Curve SDK v1.4.5
- **Program ID:** `dbcij3LWUppWqq96dh6gJWwBifmcGfLSB5D4DuSMaqN`

### Backend
- **Database:** Supabase (PostgreSQL)
- **Storage:** Supabase Storage + UploadThing
- **API:** Next.js API Routes
- **Runtime:** Node.js
- **Package Manager:** pnpm (NOT npm or yarn)

### Development Tools
- **Linting:** ESLint (Next.js config)
- **Type Checking:** TypeScript strict mode
- **Path Aliases:** `@/*` configured in tsconfig.json
- **Node Version:** Specified in .nvmrc

---

## Architecture Overview

### High-Level Flow

```
User → Next.js Frontend → API Routes → Supabase Database
                      ↓
                 Solana RPC → Meteora DBC → On-chain Token
```

### Token Creation Flow

1. User uploads image + enters token details (ticker, name)
2. Frontend calls `/api/posts/create`
3. Backend:
   - Uploads media to Supabase Storage
   - Uploads token metadata JSON
   - Creates DBC token transaction (unsigned)
   - Partially signs with baseMint keypair
4. Frontend receives partially-signed transaction
5. User signs transaction in wallet
6. Frontend submits to Solana RPC
7. Frontend calls `/api/posts/confirm` with signature
8. Backend saves post + token to database
9. Token is now tradable on Meteora/Jupiter

### Data Flow

```
React Component → useQuery/useMutation → API Route → Supabase
       ↑                                                ↓
       └─────────── React Query Cache ←─────────────────┘
```

---

## Directory Structure

```
flexstream/
├── app/                          # Next.js 14 App Router
│   ├── layout.tsx               # Root layout with providers
│   ├── page.tsx                 # Home page
│   ├── providers.tsx            # React Query setup
│   ├── analytics/               # Analytics dashboard
│   ├── api/                     # API routes (12 endpoints)
│   │   ├── posts/
│   │   │   ├── create/route.ts  # Create post + token (261 lines)
│   │   │   ├── confirm/route.ts # Confirm post creation (228 lines)
│   │   │   └── route.ts         # Get posts (207 lines)
│   │   ├── creator-coin/        # Creator coin activation
│   │   ├── users/               # User endpoints
│   │   ├── dexscreener/         # Market data
│   │   └── [other endpoints]
│   ├── create/                  # Token creation page
│   ├── dashboard/               # User dashboard
│   ├── discover/                # Discovery page
│   ├── explore/                 # Explore page
│   ├── feed/                    # Main feed
│   ├── leaderboard/             # Top creators/tokens
│   ├── live-streams/            # Live streaming tokens
│   ├── navigation/              # Navigation page
│   ├── notifications/           # User notifications
│   ├── post/[id]/              # Individual post view
│   ├── profile/                 # User profiles
│   │   ├── [username]/         # View profile
│   │   └── edit/               # Edit profile
│   ├── settings/                # App settings
│   └── verify/                  # Verification page
│
├── components/                   # React components (39 files)
│   ├── ui/                      # Radix UI primitives (shadcn/ui)
│   │   ├── avatar.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── toast.tsx
│   │   └── [10+ more]
│   ├── layout/                  # Layout components
│   │   ├── AppLayout.tsx        # Main app wrapper
│   │   ├── UniversalHeader.tsx  # Top nav
│   │   ├── MinimalSidebar.tsx   # Desktop sidebar
│   │   ├── MobileNav.tsx        # Mobile bottom nav
│   │   ├── UserMenu.tsx         # User dropdown
│   │   └── [more]
│   ├── posts/                   # Post-related components
│   │   ├── PostCard.tsx         # Main post card (150+ lines)
│   │   ├── CreatePostModal.tsx  # Create post modal
│   │   ├── PostComments.tsx     # Comment section
│   │   ├── ImageCarousel.tsx    # Multi-image display
│   │   ├── EarningsDisplay.tsx  # Token earnings
│   │   └── [more]
│   ├── feed/                    # Feed components
│   │   ├── SimpleFeed.tsx       # Main feed with infinite scroll
│   │   └── FeedFilters.tsx      # Filter UI
│   ├── creator-coin/            # Creator coin components
│   ├── explore/                 # Discovery components
│   ├── notifications/           # Notification components
│   └── solana/                  # Solana/wallet components
│       └── SolanaProvider.tsx   # Wallet provider setup
│
├── hooks/                        # Custom React hooks
│   ├── usePosts.ts              # Fetch posts (React Query)
│   ├── useTokenCreation.ts      # Token creation flow (284 lines)
│   ├── useTransactionSubmit.ts  # Submit Solana transactions
│   └── useFileUpload.ts         # File upload handling
│
├── lib/                          # Core business logic
│   ├── supabase.ts              # Supabase client setup
│   ├── meteora-dbc.ts           # Meteora DBC integration (325 lines)
│   ├── dbc-config.ts            # DBC configuration
│   ├── solana-wallet.ts         # Wallet utilities
│   ├── constants.ts             # App-wide constants
│   ├── utils.ts                 # Utility functions
│   ├── formatters.ts            # Number/date formatters
│   ├── jwt.ts                   # JWT handling
│   ├── helius.ts                # Helius API
│   ├── dexscreener.ts           # DexScreener API
│   ├── env.ts                   # Environment validation
│   ├── services/                # Service layer
│   │   └── user-service.ts      # User operations (290 lines)
│   ├── utils/                   # Additional utilities
│   └── idl/                     # Solana program IDLs
│
├── types/                        # TypeScript type definitions
│   └── index.ts                 # All types (339 lines)
│
├── public/                       # Static assets
│   └── [images, icons, etc.]
│
├── supabase/                     # Supabase configuration
│   └── migrations/              # Database migrations (10+ files)
│       ├── add_dbc_token_support.sql
│       ├── add_wallet_fields.sql
│       └── [more]
│
├── scripts/                      # Utility scripts
│   └── check-env.js             # Environment validation
│
├── setup-database.sql           # Initial database setup (6404 lines)
├── setup-storage.sql            # Storage setup (1612 lines)
├── verify-database.sql          # Database verification
│
├── package.json                 # Dependencies (pnpm)
├── pnpm-lock.yaml              # Lock file
├── tsconfig.json               # TypeScript config
├── next.config.js              # Next.js config
├── tailwind.config.js          # Tailwind config (7800 lines!)
├── postcss.config.js           # PostCSS config
├── .eslintrc.json              # ESLint config
├── env.example                 # Environment variables template
├── setup-env.sh                # Environment setup script
├── .gitignore                  # Git ignore rules
├── .nvmrc                      # Node version
├── .npmrc                      # pnpm config
└── vercel.json                 # Vercel deployment config
```

---

## Development Workflow

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd flexstream
   ```

2. **Install Node.js** (check .nvmrc for version)
   ```bash
   nvm use
   # Or: nvm install
   ```

3. **Install dependencies** (MUST use pnpm)
   ```bash
   pnpm install
   ```

4. **Set up environment variables**
   ```bash
   cp env.example .env.local
   # Edit .env.local with your values
   ```

5. **Set up Supabase**
   - Create a Supabase project
   - Run `setup-database.sql` in SQL editor
   - Run `setup-storage.sql` in SQL editor
   - Run all migrations in `supabase/migrations/`
   - Verify with `verify-database.sql`

6. **Run development server**
   ```bash
   pnpm dev
   ```

### Development Commands

```bash
# Development
pnpm dev              # Start dev server (http://localhost:3000)

# Building
pnpm build            # Production build (checks TypeScript & ESLint)

# Production
pnpm start            # Run production build

# Linting
pnpm lint             # Run ESLint

# Database
pnpm db:generate      # Generate Supabase types (update PROJECT_ID first)
```

### Git Workflow

- **Main branch:** `main` (or as specified in git config)
- **Feature branches:** Use descriptive names (e.g., `feature/token-sharing`, `fix/wallet-connect`)
- **Commit messages:** Clear, descriptive (see recent commits for style)
- **Current branch:** `claude/claude-md-mhzc1ev5zhvikep0-01UwGFcnHn7KbEDGvDjTmYq3`

---

## Key Patterns & Conventions

### TypeScript

- **Strict mode enabled** - All type errors must be resolved
- **No `any` types** - Use proper types or `unknown`
- **Interface over type** - Prefer `interface` for object shapes
- **Explicit return types** - For functions, especially public APIs

### Naming Conventions

**Files:**
- Components: `PascalCase.tsx` (e.g., `PostCard.tsx`, `UserMenu.tsx`)
- Utilities: `kebab-case.ts` (e.g., `solana-wallet.ts`, `user-service.ts`)
- API routes: `route.ts` (Next.js convention)

**Code:**
- Components: `PascalCase` (e.g., `PostCard`, `SimpleFeed`)
- Functions: `camelCase` (e.g., `formatTimeAgo`, `createToken`)
- Hooks: `camelCase` with `use` prefix (e.g., `usePosts`, `useTokenCreation`)
- Constants: `SCREAMING_SNAKE_CASE` (e.g., `DBC_PROGRAM_ID`, `MAX_FILE_SIZE`)
- Types/Interfaces: `PascalCase` (e.g., `User`, `FlexPost`, `TokenCreationData`)

**Variables:**
- Boolean: `is`, `has`, `should` prefix (e.g., `isLoading`, `hasError`, `shouldRefetch`)
- Arrays: Plural names (e.g., `posts`, `users`, `tokens`)
- Single items: Singular (e.g., `post`, `user`, `token`)

### Import Order

```typescript
// 1. React & Next.js
import { useState, useEffect } from 'react'
import Image from 'next/image'

// 2. Third-party libraries
import { useQuery } from '@tanstack/react-query'
import { Connection } from '@solana/web3.js'

// 3. Internal modules (path aliases)
import { Button } from '@/components/ui/button'
import { usePosts } from '@/hooks/usePosts'
import { formatTimeAgo } from '@/lib/utils'

// 4. Types
import type { FlexPost, User } from '@/types'

// 5. Styles (if any)
import styles from './styles.module.css'
```

### Code Style

**Components:**
```typescript
'use client' // If using client-side features

import { useState } from 'react'
import type { ComponentProps } from '@/types'

interface MyComponentProps {
  title: string
  isVisible?: boolean
  onAction?: () => void
}

export function MyComponent({ title, isVisible = true, onAction }: MyComponentProps) {
  const [state, setState] = useState<string>('')

  // Hooks at top
  // Event handlers in the middle
  // Return JSX at bottom

  return (
    <div className="flex flex-col gap-4">
      {/* Component content */}
    </div>
  )
}
```

**API Routes:**
```typescript
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic' // Prevent static optimization

export async function GET(request: NextRequest) {
  try {
    // Extract params
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    // Validate inputs
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      )
    }

    // Business logic
    const data = await fetchData(userId)

    // Return success
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('❌ Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Error Handling

**Always use try-catch for async operations:**
```typescript
try {
  const result = await riskyOperation()
  // Handle success
} catch (error) {
  console.error('❌ Error in operation:', error)
  toast.error('Operation failed. Please try again.')
  // Handle failure gracefully
}
```

**Centralized error messages** in `lib/constants.ts`:
```typescript
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: 'Please connect your wallet first',
  TOKEN_CREATION_FAILED: 'Failed to create token. Please try again.',
  // ... more
}
```

### Logging Conventions

Use emoji prefixes for clarity:
- 🚀 Starting operation
- ✅ Success
- ❌ Error
- 📝 Data/info
- 🔍 Debug/inspection

```typescript
console.log('🚀 Starting token creation...')
console.log('📝 Transaction data:', txData)
console.log('✅ Token created successfully!')
console.error('❌ Token creation failed:', error)
```

---

## Database Schema

### Core Tables

**users**
- Primary key: `id` (TEXT)
- Unique: `wallet_address`, `username`
- Key fields: `display_name`, `avatar_url`, `bio`, `verified`, `verified_earnings`
- Tier system: `success_tier` (bronze, silver, gold, diamond)
- Social counts: `total_followers`, `total_following`

**posts**
- Primary key: `id` (UUID)
- Foreign key: `user_id` → `users.id`
- Post types: `earnings_flex`, `stream_highlight`, `lifestyle`, `trading_journey`
- Media: `media_urls` (JSONB array)
- Token fields: `token_address`, `token_mint`, `token_symbol`, `token_name`
- DBC fields: `pool_address`, `bonding_curve_address`, `token_metadata_uri`
- Engagement: `likes_count`, `comments_count`, `shares_count`
- Flags: `verified`, `is_token_tradable`

**tokens**
- Primary key: `mint_address` (TEXT)
- Foreign keys: `creator_wallet` → `users.wallet_address`, `post_id` → `posts.id`
- DBC config: `pool_address`, `config_key`, `bonding_curve_address`
- Market data: `market_cap`, `price_usd`, `volume_24h`, `holders_count`
- Status: `is_tradable`, `is_migrated`, `is_graduated`

**follows**
- Composite key: `(follower_id, following_id)`
- Foreign keys: Both → `users.id`
- Self-referential join table

**likes**
- Composite key: `(user_id, post_id)`
- Foreign keys: `user_id` → `users.id`, `post_id` → `posts.id`

**comments**
- Primary key: `id` (UUID)
- Foreign keys: `user_id`, `post_id`, `parent_id` (for nested comments)
- Content: `content` (TEXT)

**token_trades**
- Primary key: `signature` (TEXT)
- Foreign key: `token_mint` → `tokens.mint_address`
- Trade data: `trader_wallet`, `token_amount`, `sol_amount`, `trade_type` (buy/sell)
- Timestamp: `block_time`

**notifications**
- Tracks user notifications
- Types: like, comment, follow, token_trade

**earnings_verifications**
- Verify earnings claims
- Link to external proof

### Database Views

**token_leaderboard**
- Top tokens by market cap
- Includes creator info, post data

**trending_tokens**
- Recent trading activity
- Volume-based sorting

### Row Level Security (RLS)

- **Read access:** Public for most tables
- **Write access:** Users can only modify their own data
- **Admin access:** Service role key for backend operations

### Indexes

Critical indexes for performance:
- `posts(user_id, created_at DESC)`
- `posts(type, created_at DESC)`
- `follows(follower_id)`, `follows(following_id)`
- `likes(user_id)`, `likes(post_id)`
- `comments(post_id, created_at DESC)`
- `tokens(creator_wallet)`, `tokens(market_cap DESC)`

---

## API Conventions

### API Routes Structure

All API routes in `app/api/`:
- **RESTful naming** where possible
- **Verb-based** for actions (e.g., `/create`, `/confirm`)
- **Force dynamic** rendering: `export const dynamic = 'force-dynamic'`

### Request/Response Format

**Request:**
```typescript
// GET with query params
GET /api/posts?userId=123&limit=20&offset=0

// POST with JSON body
POST /api/posts/create
Content-Type: application/json

{
  "content": "My post content",
  "ticker": "FLEX",
  "mediaUrls": ["https://..."]
}
```

**Response:**
```typescript
// Success
{
  "success": true,
  "data": { /* ... */ }
}

// Error
{
  "error": "Error message here"
}
// Status code: 400/401/404/500
```

### Key Endpoints

**Posts:**
- `GET /api/posts` - Fetch posts (pagination, filtering)
- `POST /api/posts/create` - Create post + token (returns unsigned transaction)
- `POST /api/posts/confirm` - Confirm post creation after user signs

**Users:**
- `GET /api/users/by-wallet?address=...` - Find user by wallet

**Creator Coin:**
- `POST /api/creator-coin/activate` - Activate creator coin
- `POST /api/creator-coin/confirm` - Confirm activation

**Utilities:**
- `POST /api/send-transaction` - Submit signed transaction to Solana
- `POST /api/upload-metadata` - Upload token metadata
- `POST /api/upload` - General file upload
- `GET /api/dexscreener/market-cap?address=...` - Fetch market cap

### Authentication

**Current:** Wallet-based authentication
- User signs message with wallet
- JWT stored in localStorage (if implemented)
- Wallet address used as primary identifier

**Backend verification:**
- Check wallet address in request
- Verify signature (if required)
- Use Supabase service role key for database operations

### Error Handling Pattern

```typescript
export async function POST(request: NextRequest) {
  try {
    // 1. Extract & validate inputs
    const body = await request.json()
    if (!body.required_field) {
      return NextResponse.json(
        { error: 'Missing required_field' },
        { status: 400 }
      )
    }

    // 2. Business logic
    const result = await doSomething(body)

    // 3. Return success
    return NextResponse.json({ success: true, data: result })

  } catch (error) {
    console.error('❌ API Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
```

---

## Component Patterns

### UI Component Pattern (shadcn/ui style)

Located in `components/ui/`:
- Use Radix UI primitives
- Class variance authority for variants
- Tailwind for styling
- Forward refs where needed

Example:
```typescript
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({ className, variant = 'default', size = 'md', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md',
        'transition-colors focus-visible:outline-none',
        variant === 'default' && 'bg-primary text-white hover:bg-primary/90',
        variant === 'outline' && 'border border-input hover:bg-accent',
        size === 'sm' && 'h-9 px-3 text-sm',
        size === 'md' && 'h-10 px-4',
        className
      )}
      {...props}
    />
  )
}
```

### Feature Component Pattern

Located in `components/[feature]/`:
- Use `'use client'` directive if needed
- Props interface defined
- Hooks at top of component
- Event handlers before JSX
- Return JSX at bottom

```typescript
'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PostCard } from './PostCard'
import type { FlexPost } from '@/types'

interface FeedProps {
  userId?: string
  limit?: number
}

export function Feed({ userId, limit = 20 }: FeedProps) {
  const [filter, setFilter] = useState<string>('all')

  const { data: posts, isLoading } = useQuery({
    queryKey: ['posts', userId, filter],
    queryFn: () => fetchPosts({ userId, filter, limit })
  })

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter)
  }

  if (isLoading) return <LoadingState />
  if (!posts?.length) return <EmptyState />

  return (
    <div className="flex flex-col gap-4">
      <FeedFilters value={filter} onChange={handleFilterChange} />
      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}
```

### Layout Component Pattern

Located in `components/layout/`:
- Wrap application or pages
- Provide navigation, headers, sidebars
- Responsive design (desktop/mobile)

Example: `AppLayout.tsx` provides:
- Header (UniversalHeader)
- Sidebar (MinimalSidebar) - desktop only
- Mobile nav (MobileNav) - mobile only
- Main content area

---

## State Management

### React Query (Primary)

**Configuration** in `app/providers.tsx`:
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,  // 60 seconds
      retry: 1
    }
  }
})
```

**Usage pattern:**
```typescript
// In hook (hooks/usePosts.ts)
export function usePosts(userId?: string) {
  return useQuery({
    queryKey: ['posts', userId],
    queryFn: async () => {
      const res = await fetch(`/api/posts?userId=${userId}`)
      const data = await res.json()
      return data.posts
    },
    refetchInterval: 5000  // Auto-refetch every 5s
  })
}

// In component
const { data: posts, isLoading, error } = usePosts()
```

**Mutations:**
```typescript
const mutation = useMutation({
  mutationFn: createPost,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['posts'] })
    toast.success('Post created!')
  },
  onError: (error) => {
    toast.error('Failed to create post')
  }
})
```

### Local State (useState)

For component-specific state:
```typescript
const [isOpen, setIsOpen] = useState(false)
const [formData, setFormData] = useState<FormData>({})
```

### Zustand (Available but Unused)

Package installed but not actively used. If you need global state beyond React Query, you can implement Zustand stores.

---

## Common Tasks

### Adding a New Page

1. Create file in `app/[route]/page.tsx`
2. Export default component:
   ```typescript
   export default function MyPage() {
     return <div>My Page</div>
   }
   ```
3. Add route to navigation in `components/layout/MinimalSidebar.tsx` and `MobileNav.tsx`
4. Add metadata in `page.tsx` (optional):
   ```typescript
   export const metadata = {
     title: 'My Page | FlexStream',
     description: 'Page description'
   }
   ```

### Adding a New API Endpoint

1. Create `app/api/[route]/route.ts`
2. Export HTTP method handler:
   ```typescript
   export const dynamic = 'force-dynamic'

   export async function GET(request: NextRequest) {
     // Implementation
   }
   ```
3. Use Supabase client with service role key for database access
4. Follow error handling pattern (try-catch)
5. Return JSON responses with `NextResponse.json()`

### Adding a New Component

1. Create file in `components/[category]/[ComponentName].tsx`
2. Define props interface
3. Implement component
4. Export from component file
5. Import where needed using path alias: `@/components/[category]/[ComponentName]`

### Adding a Database Table

1. Create migration in `supabase/migrations/[timestamp]_[description].sql`
2. Define table schema with:
   - Primary key
   - Foreign keys (with ON DELETE CASCADE/SET NULL)
   - Indexes for frequently queried columns
   - RLS policies
3. Run migration in Supabase SQL editor
4. Update TypeScript types in `types/index.ts`
5. Regenerate Supabase types: `pnpm db:generate` (update PROJECT_ID first)

### Updating Token Creation Flow

Key files:
- `hooks/useTokenCreation.ts` - Frontend state machine
- `app/api/posts/create/route.ts` - Backend transaction creation
- `app/api/posts/confirm/route.ts` - Post-signature confirmation
- `lib/meteora-dbc.ts` - DBC integration logic

### Adding a New Solana Program Integration

1. Add program SDK to dependencies: `pnpm add @program/sdk`
2. Add program ID to `lib/constants.ts`
3. Create client class in `lib/[program-name].ts`
4. Add TypeScript IDL to `lib/idl/[program].json` (if available)
5. Create hook in `hooks/use[ProgramName].ts`
6. Use in components

---

## Environment Setup

### Required Environment Variables

See `env.example` for all variables. Critical ones:

```bash
# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=FlexStream

# Solana
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=devnet

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres

# File Upload
UPLOADTHING_SECRET=sk_...
UPLOADTHING_APP_ID=your_app_id

# Meteora DBC
POOL_CONFIG_KEY=GDo9K18dcHx34zefEoS7JkRPKgMQpEnS4ASDLBBbmcWF
DBC_CREATOR_PRIVATE_KEY=base58_encoded_private_key

# Optional
HELIUS_API_KEY=your_helius_api_key
```

### Environment Validation

Run the validation script before starting development:
```bash
node scripts/check-env.js
```

This checks for:
- Required variables
- Valid URLs
- Accessible RPC endpoints
- Supabase connectivity

---

## Deployment

### Vercel (Recommended)

**Configuration** in `vercel.json`:
```json
{
  "framework": "nextjs",
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install"
}
```

**Steps:**
1. Connect repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy

**Important:**
- Use production Solana RPC (not devnet public RPC)
- Increase RPC rate limits
- Use Supabase production instance
- Enable production mode in DBC config

### Build Process

```bash
# Locally
pnpm build

# Vercel automatically runs:
# 1. pnpm install
# 2. pnpm build
# 3. Type checking
# 4. Linting
```

**Build Requirements:**
- No TypeScript errors (strict mode)
- No ESLint errors
- All environment variables set
- Database migrations applied

---

## Troubleshooting

### Common Issues

**1. "Cannot find module '@/...'" error**
- Check `tsconfig.json` path aliases
- Restart TypeScript server in IDE
- Clear `.next` cache: `rm -rf .next`

**2. Wallet not connecting**
- Check wallet adapter versions match
- Verify Solana network (devnet/mainnet) in config
- Check browser console for errors
- Try different wallet (Phantom, Solflare)

**3. Token creation fails**
- Check `DBC_CREATOR_PRIVATE_KEY` is set
- Verify creator wallet has SOL for rent
- Check Meteora program is accessible
- Inspect transaction logs in Solana Explorer

**4. Database queries fail**
- Verify Supabase connection (check env vars)
- Check RLS policies (may need to disable for testing)
- Review Supabase logs in dashboard
- Ensure migrations are applied

**5. Build fails on Vercel**
- Check build logs for TypeScript errors
- Verify all environment variables are set in Vercel
- Ensure `pnpm` is used (not npm/yarn)
- Check Next.js version compatibility

**6. Images not loading**
- Add domain to `next.config.js` `images.domains`
- Check CORS settings on image host
- Verify Supabase storage permissions

### Debugging Tips

**Enable verbose logging:**
```typescript
// In API routes
console.log('📝 Request:', {
  method: request.method,
  url: request.url,
  headers: Object.fromEntries(request.headers),
  body: await request.json()
})
```

**Check Solana transactions:**
```typescript
console.log('🔍 Transaction signature:', signature)
console.log('🔍 Explorer:', `https://explorer.solana.com/tx/${signature}?cluster=devnet`)
```

**React Query DevTools:**
Add to `app/layout.tsx` in development:
```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

// In component
<ReactQueryDevtools initialIsOpen={false} />
```

---

## AI Assistant Guidelines

### When Working on This Codebase

1. **Always read files before editing**
   - Use Read tool to see current state
   - Understand context and patterns
   - Match existing code style

2. **Follow established patterns**
   - Use existing component patterns
   - Match naming conventions
   - Follow API response formats
   - Use centralized constants/utilities

3. **Type safety is critical**
   - No `any` types
   - Define proper interfaces
   - Import types from `@/types`
   - Run type checking before committing

4. **Test your changes**
   - Run `pnpm build` to check for errors
   - Test in browser (use `pnpm dev`)
   - Check console for warnings
   - Verify database queries in Supabase dashboard

5. **Use path aliases**
   - `@/components/...` not `../../components/...`
   - `@/lib/...` not `../../../lib/...`
   - `@/types` for type imports

6. **Handle errors gracefully**
   - Always use try-catch for async operations
   - Use centralized error messages from `lib/constants.ts`
   - Show user-friendly toast notifications
   - Log errors with emoji prefixes

7. **Optimize for performance**
   - Use React.memo() for expensive components
   - Implement proper loading states
   - Add skeleton loaders
   - Use React Query caching effectively

8. **Maintain consistency**
   - Match indentation (2 spaces)
   - Use single quotes for strings
   - Use semicolons consistently
   - Follow existing component structure

9. **Document complex logic**
   - Add comments for non-obvious code
   - Document API endpoints
   - Update this CLAUDE.md when adding major features

10. **Security considerations**
    - Never expose private keys in frontend
    - Validate all user inputs
    - Use service role key only in API routes
    - Sanitize user-generated content
    - Check wallet ownership before mutations

### Common Mistakes to Avoid

❌ **Don't:**
- Use `npm` or `yarn` (use `pnpm` only)
- Import from `react-dom/client` in components (use `next/...`)
- Hardcode values that should be in `constants.ts`
- Skip error handling on async operations
- Use relative imports for cross-directory imports
- Create components without TypeScript interfaces
- Expose sensitive keys in client components
- Skip type checking (`// @ts-ignore`)

✅ **Do:**
- Use `pnpm` for all package operations
- Import Next.js components (`next/image`, `next/link`)
- Use constants from `lib/constants.ts`
- Wrap async operations in try-catch
- Use path aliases (`@/...`)
- Define proper TypeScript interfaces
- Keep sensitive operations server-side (API routes)
- Fix type errors properly

### File Modification Checklist

Before making changes:
- [ ] Read the file to understand current implementation
- [ ] Check related files (types, hooks, components)
- [ ] Understand the data flow
- [ ] Identify patterns to follow

After making changes:
- [ ] Run type checking: `pnpm tsc --noEmit`
- [ ] Run linting: `pnpm lint`
- [ ] Test in development: `pnpm dev`
- [ ] Check for console errors/warnings
- [ ] Verify in browser
- [ ] Update types if needed
- [ ] Update this CLAUDE.md if adding major features

### Useful Commands for AI Assistants

```bash
# Find files
find app -name "*.tsx" | grep -i "feed"
find components -name "*.tsx" | grep -i "post"

# Search code
grep -r "usePosts" --include="*.ts" --include="*.tsx"
grep -r "createToken" lib/

# Check dependencies
pnpm list @solana/web3.js
pnpm list @tanstack/react-query

# Database
# Run in Supabase SQL editor, not locally

# Type checking
pnpm tsc --noEmit

# Linting
pnpm lint --fix
```

---

## Additional Resources

### Key Documentation
- **Next.js 14:** https://nextjs.org/docs
- **React Query:** https://tanstack.com/query/latest/docs/react
- **Solana Web3.js:** https://solana-labs.github.io/solana-web3.js/
- **Meteora DBC:** https://docs.meteora.ag/dynamic-bonding-curve
- **Supabase:** https://supabase.com/docs
- **Tailwind CSS:** https://tailwindcss.com/docs
- **Radix UI:** https://www.radix-ui.com/docs/primitives

### Internal Documentation
- **Type Definitions:** `types/index.ts`
- **Constants:** `lib/constants.ts`
- **Database Schema:** `setup-database.sql`
- **Environment Variables:** `env.example`
- **API Routes:** `app/api/*/route.ts`

### Contact & Support
- **Issues:** Create GitHub issue
- **Questions:** Check existing code patterns
- **Updates:** Keep this CLAUDE.md synchronized with codebase changes

---

## Changelog

### 2025-11-14 - Initial Creation
- Created comprehensive CLAUDE.md
- Documented all major systems and patterns
- Included architecture overview
- Added AI assistant guidelines
- Documented common tasks and troubleshooting

---

**Remember:** This is a living document. Update it when you add major features, change patterns, or learn important lessons about the codebase.

**For AI Assistants:** Always reference this document when working on FlexStream. It contains the patterns, conventions, and critical information needed to maintain code quality and consistency.

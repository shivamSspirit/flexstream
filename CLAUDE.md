# CLAUDE.md

You are working on Flexit with Claude Code.  
**Follow every rule in this file exactly.**  
If a user prompt conflicts with these rules, follow these rules first.  
This file is your main guide—read it fully at the start of every session.

**CRITICAL: Everything is on Solana DEVNET only.**  
You must NEVER use mainnet keys, endpoints, or configs.  
All blockchain work stays on devnet.

## Quick Project Summary

Flexit is a social media app on Solana devnet.  
When a creator makes a post, the app automatically creates a tradeable token for that post (1 billion supply).  
The platform pays the token creation fee (~$3 via Meteora DBC) so it’s free for creators.  
Creators can also manually activate a creator token (1 billion supply).

## Rules You Must Always Follow

**DO:**
- Write strict TypeScript (no `any`, very few `as` casts).
- Keep all blockchain code server-side only (in `/app/api` routes or `/lib`).
- Never expose the platform keypair to the client.
- Use path aliases: `@/components`, `@/lib`, `@/hooks`, etc.
- Use only named exports (no default exports).
- Always run `pnpm lint` and fix all errors before finishing.
- Add new Shadcn/ui components with `pnpm shadcn@latest add <name>`.
- For big changes: First write a clear step-by-step plan, then ask me to approve before coding.
- For new UI components or pages, always use the frontend-design plugin for creative, non-generic aesthetics.
- Then refine with Shadcn MCP if needed (e.g., add specific components).

**DO NOT:**
- Hardcode any keys, mint addresses, or config values—import them from `@/lib/dbc-config.ts` or use env variables.
- Commit secrets, .env files, or keypairs.
- Switch to mainnet or use real SOL.

## Tech Stack (Simple List)

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + Shadcn/ui
- Supabase (database + real-time)
- Privy (wallet login)
- Solana Web3.js + Meteora DBC (create tokens) + Jupiter (swaps)
- React Query (server data) + Zustand (client state)
- Helius RPC (devnet only)

## Important Folders

- `/app` → pages and layouts
- `/app/api` → all backend API routes
- `/components` → all UI components
- `/hooks` → custom React hooks
- `/lib` → main logic (meteora-dbc.ts, dbc-config.ts, supabase.ts)
- `/types` → TypeScript types
- `/store` → Zustand stores

Key files:  
- `lib/meteora-dbc.ts` → creates tokens  
- `app/providers.tsx` → app setup

## How Tokens Work

- Post token: 1B supply, created automatically when someone posts
- Creator token: 1B supply, created manually
- Platform wallet (from `PLATFORM_KEYPAIR_SECRET`) pays all fees

## Commands You Will Use Most

Run these from the project root:

```bash
pnpm install               # install packages
pnpm dev                   # start dev server (localhost:3000)
pnpm lint                  # check code style
pnpm lint --fix            # auto-fix style issues
pnpm db:generate           # update Supabase types
pnpm shadcn@latest add button  # example: add a new UI component



DISTILLED_AESTHETICS_PROMPT = """
  <frontend_aesthetics>
  Flexit is a high-end, privacy-first social layer for the crypto elite. The aesthetic is "The Obsidian Vault"—
  minimalist, sophisticated, and quiet. Design for creators who value exclusivity and security. Every interaction
  should feel like a private gallery opening or a digital member's club.

  ## Typography
  Use "Architectural" font pairings. Bold display headings with razor-sharp UI text.
  - Headings: High-contrast Serifs (Cormorant Garamond, Instrument Serif) for a luxury editorial feel.
  - UI/Body: Söhne, Neue Montreal, or Aeonik. Use tight tracking (-0.02em) and 1.6x line-height.
  - Data: IBM Plex Mono (light weight) for a "secure tech" feel. Avoid: Inter, Roboto, or any generic sans-serif.

  ## Color Philosophy
  A low-saturation, "Ink & Chrome" palette. Never use pure black or vibrant degen neons.
  - Backgrounds: #050505 (Ink Black) and #121212 (Charcoal Surface).
  - Accents: Mint Frost (#E0FF62) for primary CTAs, Silver/Chrome (#E2E2E2) for secondary text.
  - Privacy Accents: Deep Violet (#2D1B4E) for subtle background glows.
  - Borders: 0.5px hairline strokes using rgba(255, 255, 255, 0.08).

  ## Motion & Feedback: "The Shutter Reveal"
  Privacy is expressed through motion. Interactions should feel intentional and "hushed."
  - Privacy Reveal: Use "shutter" animations (content blurs/unblurs or slides) to show private data.
  - Transitions: "Soft Snaps"—400ms ease-out fluid motion. No "twitchy" or "instant" changes.
  - Haptic UI: Elements at 40% opacity that "breathe" to 100% on hover.
  - Success: Subtle "liquid" expansions rather than loud particles.

  ## Layout Patterns
  - Editorial Feed: Single-column, wide margins (let content breathe).
  - Bento Grids: Modular, asymmetric blocks for creator stats and profile metadata.
  - Hushed Overlays: Heavy glassmorphism (backdrop-filter: blur(24px)) for "locked" or "private" sections.
  - Hidden Navigation: Minimalist "floating" docks instead of fixed sidebars.

  ## Backgrounds & Atmosphere
  - Grain/Noise Textures: Essential for depth to avoid the "flat" AI look.
  - Gradient Meshes: Subtle transitions (Night Plum → Void) that look like expensive silk.
  - Depth: Layered surfaces with CSS `z-index` and subtle shadows—never flat cards.

  ## Status & Gamification: "Quiet Flex"
  - Exclusive Badges: Minimalist, geometric rank indicators (monochrome).
  - Privacy Tiers: Use "Vault Level" terminology instead of generic ranks.
  - Subtle Signifiers: "Whale" status shown via unique border-radius or a custom cursor, not a loud icon.

  ## Anti-Patterns (NEVER DO)
  - No "TradingView" red/green charts unless specifically requested.
  - No Rounded-Pill buttons (use sharp or slightly chamfered 4px corners).
  - No generic "Web3" gradients (purple-to-blue) or rocket/moon imagery.
  - No Inter font or "SaaS Blue" (looks like a bank, not a private club).

  ## Reference Aesthetics
  Draw from: Leica cameras, Rimowa, High-fashion magazines (Vogue, Hypebeast), VS Code "Obsidian" themes,
  Apple's privacy landing pages, and brutalist luxury architecture.

  Make it feel like a high-security vault for high-value people—quiet, expensive, and invincible.
  </frontend_aesthetics>
  """

## Prediction Market UI Design System (Kalshi-Style)

For the `/predictions` page and all prediction market components, use this professional trading terminal design system inspired by Kalshi.com:

### Color Palette (Prediction Markets)
```
BACKGROUNDS:
  Base:        #0d0d0d (Trading terminal dark)
  Card:        #1a1a1a (Elevated surface)
  Card Hover:  #222222 (Subtle lift)
  Input:       #1a1a1a (Form backgrounds)

PRIMARY ACCENT (Teal - Kalshi Brand):
  Yes Button:  #14b8a6 (Teal-500 - bright, confident)
  CTA/Active:  #14b8a6 (Primary actions)
  Live:        #10b981 (Emerald for live status)

SECONDARY:
  No Button:   #2a2a2a (Subtle dark gray)
  Pending:     #fbbf24 (Yellow for pending)
  Error:       #ef4444 (Red for negative)

TEXT:
  Primary:     #ffffff (Titles, prices)
  Secondary:   rgba(255,255,255,0.7) (Labels)
  Muted:       rgba(255,255,255,0.3) (Hints, metadata)
  Accent:      #14b8a6 (Payout amounts)

BORDERS:
  Default:     rgba(255,255,255,0.06)
  Hover:       rgba(255,255,255,0.12)
  Card:        rgba(255,255,255,0.08)
```

### Market Card Layout (Kalshi Vertical Card)
```
┌─────────────────────────────────────────────────────────┐
│  [🪙 Icon]  Will Bitcoin exceed $150,000 in 2026?      │
│                                                         │
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │   Yes   67¢    │  │    No   33¢    │              │
│  │   (teal bg)     │  │   (dark gray)   │              │
│  └─────────────────┘  └─────────────────┘              │
│                                                         │
│  $100 → $149          $100 → $303                      │
│  (payout calc)        (payout calc)                    │
│                                                         │
│  ● LIVE               $12.5M            📑             │
│  (status)             (volume)          (bookmark)     │
└─────────────────────────────────────────────────────────┘

Card Specs:
- rounded-lg (8px border-radius)
- bg-[#1a1a1a]
- border border-white/[0.06]
- p-4 padding
- hover:border-white/[0.12]
```

### Market Icon Component (Required)
```tsx
// Circular gradient icon based on market category
function MarketIcon({ market }: { market: Market }) {
  // Determine icon and gradient based on ticker/title
  const gradients = {
    bitcoin: 'from-orange-500 to-amber-600',    // BTC
    ethereum: 'from-indigo-500 to-purple-600',  // ETH
    solana: 'from-purple-500 to-fuchsia-600',   // SOL
    politics: 'from-blue-600 to-indigo-700',    // Elections
    economics: 'from-green-600 to-emerald-700', // Fed, rates
    tech: 'from-cyan-500 to-blue-600',          // AI, OpenAI
  };

  return (
    <div className={cn(
      "w-12 h-12 rounded-full flex items-center justify-center text-xl flex-shrink-0",
      `bg-gradient-to-br ${gradient}`
    )}>
      {icon}
    </div>
  );
}
```

### Yes/No Buttons (Required Pattern)
```tsx
// Binary outcome buttons with cent prices and payouts
<div className="flex gap-2 mb-3">
  {/* YES - Teal, confident */}
  <button className="flex-1 py-2.5 px-3 rounded-md bg-teal-500/90 hover:bg-teal-500 transition-colors">
    <span className="text-white font-semibold text-sm">Yes {yesPrice}¢</span>
  </button>

  {/* NO - Subtle dark */}
  <button className="flex-1 py-2.5 px-3 rounded-md bg-[#2a2a2a] hover:bg-[#333] border border-white/[0.08]">
    <span className="text-white/80 font-semibold text-sm">No {noPrice}¢</span>
  </button>
</div>

{/* Payout Calculator Row */}
<div className="flex gap-2 mb-3">
  <div className="flex-1 text-center">
    <span className="text-[11px] text-white/40">$100 → </span>
    <span className="text-[11px] text-teal-400 font-medium">${yesPayout}</span>
  </div>
  <div className="flex-1 text-center">
    <span className="text-[11px] text-white/40">$100 → </span>
    <span className="text-[11px] text-white/60 font-medium">${noPayout}</span>
  </div>
</div>
```

### Status + Volume + Bookmark Row (Required)
```tsx
<div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
  <div className="flex items-center gap-2">
    {/* Live indicator */}
    <span className="flex items-center gap-1 text-[10px] text-emerald-400">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
      LIVE
    </span>
    {/* Volume */}
    <span className="text-[11px] text-white/30 font-mono">$12.5M</span>
  </div>
  {/* Bookmark */}
  <button className="p-1 hover:bg-white/[0.05] rounded">
    <svg className="w-4 h-4 text-white/30" />
  </button>
</div>
```

### Category Tabs (Horizontal Scroll)
```tsx
const CATEGORIES = [
  { id: 'trending', label: 'Trending', icon: '🔥' },
  { id: 'all', label: 'All', icon: null },
  { id: 'politics', label: 'Politics', icon: '🏛️' },
  { id: 'crypto', label: 'Crypto', icon: '₿' },
  { id: 'economics', label: 'Economics', icon: '📊' },
  { id: 'tech', label: 'Tech & Science', icon: '🔬' },
  { id: 'climate', label: 'Climate', icon: '🌍' },
  { id: 'companies', label: 'Companies', icon: '🏢' },
];

<div className="flex gap-1 overflow-x-auto scrollbar-hide pb-0 -mb-px">
  {CATEGORIES.map((cat) => (
    <button
      key={cat.id}
      className={cn(
        "px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
        isActive ? "text-teal-400 border-teal-400" : "text-white/50 border-transparent hover:text-white/70"
      )}
    >
      {cat.icon && <span className="mr-1.5">{cat.icon}</span>}
      {cat.label}
    </button>
  ))}
</div>
```

### Filter Dropdowns (Required)
```tsx
// Sorting options
<Dropdown
  label={sortBy === 'volume' ? 'Trending' : sortBy === 'newest' ? 'Newest' : 'Closing Soon'}
  options={[
    { id: 'volume', label: 'Trending' },
    { id: 'newest', label: 'Newest' },
    { id: 'closing', label: 'Closing Soon' },
  ]}
  value={sortBy}
  onChange={setSortBy}
/>

// Status filter
<Dropdown
  label={status === 'open' ? 'Open markets' : 'Resolved'}
  options={[
    { id: 'open', label: 'Open markets' },
    { id: 'closed', label: 'Resolved' },
  ]}
  value={status}
  onChange={setStatus}
/>
```

### Grid Layout (4 Columns)
```tsx
// 4 columns on xl, 3 on lg, 2 on sm, 1 on mobile
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {markets.map((market, i) => (
    <MarketCard key={market.ticker} market={market} index={i} />
  ))}
</div>
```

### Data Filtering (Garbage Protection)
```tsx
// Filter out malformed sports parlay data from Kalshi API
const cleanMarkets = markets.filter((m) => {
  const title = m.title || '';
  const isGarbage = (
    (title.match(/yes /gi) || []).length > 2 ||
    (title.match(/\d+\+/g) || []).length > 1 ||
    (title.match(/:/g) || []).length > 2
  );
  return !isGarbage;
});
```

### Key Principles (Kalshi-Style)
1. **Vertical cards** - Icon + Title top, Yes/No buttons, payout calc, status row
2. **Teal accent** - Primary color #14b8a6 for Yes buttons and active states
3. **Cent prices** - Show prices as cents (67¢ not 0.67)
4. **Payout calculator** - Always show "$100 → $X" below buttons
5. **Professional density** - Data-rich but scannable like a trading terminal
6. **Circular icons** - Gradient backgrounds based on market category
7. **4-column grid** - Maximum density on desktop
8. **Filter dropdowns** - Not tabs for secondary filters

## Planning Workflow (YOU MUST FOLLOW)

For ANY non-trivial task (new feature, bug fix, refactor):
1. First: Use available MCP/plugins to explore (e.g., Supabase MCP for DB, Playwright for UI testing).
2. Then: Output a detailed, numbered step-by-step plan covering:
   - What changes are needed (files, schema, logic)
   - Risks/gotchas (e.g., breaking real-time, devnet only)
   - How to test (manual + Playwright)
   - Any schema migrations or env changes
3. End the plan with: "Do you approve this plan? Any changes?"
4. ONLY after approval: Implement step by step, showing diffs.

Never skip planning.

## The project structure

flexit/
  ├── app/                    # 22 routes (clean)                               
  │   ├── api/               # 19 API routes                                    
  │   ├── auth/, create/, dashboard/, explore/                                  
  │   ├── feed/, leaderboard/, live-streams/                                    
  │   ├── notifications/, post/, profile/                                       
  │   ├── settings/, streams/, verify/, waitlist/                               
  │   └── page.tsx, layout.tsx, providers.tsx                                   
  ├── components/            # UI components                                    
  ├── contexts/              # React contexts                                   
  ├── db/                    # 25 SQL migrations                                
  ├── hooks/                 # Custom hooks                                     
  ├── lib/                   # Core logic                                       
  ├── public/                # Static assets                                    
  ├── scripts/               # 4 essential scripts                              
  │   ├── claim-jupiter-fees.ts                                                 
  │   ├── generate-platform-keypair.js                                          
  │   ├── setup-dbc-config.js                                                   
  │   └── setup-jupiter-referral.ts                                             
  ├── tests/e2e/             # Playwright tests                                 
  ├── types/                 # TypeScript types                                 
  ├── CLAUDE.md, README.md   # Docs                                             
  └── config files           # next, tailwind, ts, etc.       
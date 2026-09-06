# Flexit Project Showcase

## The idea

Flexit is a social trading prototype for Solana. It explores how creators can publish content and optionally connect each post with a tradable token, giving followers a social way to discover creator-led opportunities.

## What I built

I built the application as a full-stack Next.js and TypeScript project. The main vertical slice is post creation:

1. A creator enters content, uploads media, and optionally provides a token ticker.
2. The Next.js API validates the request, applies rate limiting, and uploads media to Supabase Storage.
3. The Meteora client creates token metadata, constructs the bonding-curve transaction, submits it through Solana RPC, and confirms the signature.
4. Supabase stores the user, post, token, pool, and transaction references.
5. React Query updates the feed cache while Supabase Realtime handles subsequent feed updates.

Plain posts use a simpler persistence path, while token-backed posts use the blockchain flow. This separation keeps the core social experience usable without forcing every post to create a token.

## Architecture

The browser contains the Next.js pages, React components, wallet interactions, and cached query state. Privy manages wallet onboarding. Next.js route handlers coordinate Supabase, Supabase Storage, Meteora, Solana RPC, prediction providers, and optional Upstash rate limiting.

The repository is a single application, which makes the complete request path easy to inspect. PostgreSQL and Solana remain separate systems, so their writes are not atomic.

## Engineering decisions

- Platform-funded token creation reduces friction for creators, while the backend retains transaction signatures for inspection.
- Media uploads use bounded retries to handle transient storage failures.
- React Query and Realtime reduce unnecessary polling and keep feed state responsive.
- Rate limiting protects posting and trading endpoints when Redis is available.
- API routes return explicit validation errors and warnings for partial persistence failures.

## Current scope

This is a source-reviewable prototype. The post and token creation paths are the best areas to evaluate. Server-side wallet ownership verification, operation idempotency, and blockchain/database reconciliation still need production hardening. Swap signing, Jito status checks, and parts of the prediction experience remain incomplete or use documented fallback behavior.

## Where to review the code

- [Create page](app/create/page.tsx)
- [Token-post API](app/api/posts/create/route.ts)
- [Meteora client](lib/meteora-dbc.ts)
- [Realtime feed hook](hooks/useRealtimePosts.ts)
- [Privy provider](components/providers/PrivyProvider.tsx)
- [End-to-end tests](tests/e2e/)

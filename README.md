# FlexIt - The Verified Social Platform for Solana & Crypto Creators

A modern social media platform built for Solana traders, crypto creators, and DeFi builders to showcase verified performance, launch tokens, build community, and monetize expertise.

## 🚀 Features

### Core Features
- **Verified Creator Profiles**: Blockchain-verified trading history and on-chain performance
- **Dual Token System**: Profile-level creator coins + unlimited post-level tokens
- **Private Token Launches**: Launch tokens to holders only, protecting your alpha
- **Social Feed**: Infinite scroll feed with real-time updates from the crypto community
- **Real-time Interactions**: Likes, comments, shares, tips with live updates
- **Mobile-First Design**: Optimized for mobile consumption

### Creator Monetization
- **Premium Subscriptions**: Charge $20-100/month for exclusive content access
- **Direct Tips**: Receive SOL or token tips from followers
- **Token Trading Fees**: Earn from post token volume
- **Copy Trading**: Commission-based income from trading signals
- **Recurring Revenue**: Build sustainable income from your expertise

### Advanced Features
- **Wallet Integration**: Solana wallet connection for verification
- **Achievement Badges**: Auto-generated from verified trades
- **Private Launches**: Holder-only access to new tokens
- **Search & Discovery**: Find verified creators and trending content
- **Notifications**: Real-time notifications for interactions
- **Media Upload**: Image and video support for posts

## 🛠 Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + Shadcn/ui components
- **Database**: Supabase (PostgreSQL) with real-time subscriptions
- **Authentication**: Jup wallet integration
- **State Management**: Zustand + React Query
- **Forms**: React Hook Form + Zod validation
- **Deployment**: Vercel

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd flexstream
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Fill in your environment variables:
   - Supabase credentials
   - Clerk authentication keys
   - Uploadthing configuration
   - Solana RPC endpoints

4. **Set up the database**
   ```bash
   # Run the migration in your Supabase dashboard
   # Or use the Supabase CLI
   supabase db reset
   ```

5. **Start the development server**
   ```bash
   pnpm dev
   ```

## 🗄 Database Schema

The application uses the following main tables:

- **users**: User profiles with wallet addresses and success tiers
- **posts**: Social media posts with earnings and verification data
- **follows**: User follow relationships
- **likes**: Post likes
- **comments**: Post comments with threading support
- **notifications**: Real-time notifications
- **earnings_verifications**: Blockchain verification records

## 🔐 Authentication Flow

FlexIt uses a dual authentication system combining email/social login with Solana wallet connection:

### Email/Social Authentication (Clerk)
1. **Sign Up/Sign In**: Users authenticate via Clerk using email or social providers (Google, Twitter, etc.)
2. **JWT Token**: After authentication, a JWT token is generated for API access
3. **Profile Creation**: Set up username, bio, and profile information

### Wallet Connection (Jup Solana Wallet Adapter)
1. **Connect Wallet**: Users connect their Solana wallet (Phantom, Solflare, etc.)
2. **Wallet Linking**: The connected wallet address is linked to the user's Clerk account (1:1 mapping)
3. **Trading Access**: Wallet connection is required for trading and creator coin operations

### Example Usage

**Check Authentication State:**
```typescript
'use client';
import { useAuth } from '@clerk/nextjs';
import { useWallet } from '@solana/wallet-adapter-react';

export default function MyComponent() {
  const { isLoaded, isSignedIn } = useAuth();
  const { connected, publicKey } = useWallet();
  
  const isFullyAuthenticated = isSignedIn && connected;
  
  if (!isSignedIn) {
    return <div>Please sign in</div>;
  }
  
  if (!connected) {
    return <div>Please connect your Solana wallet</div>;
  }
  
  return <div>Welcome! Wallet: {publicKey?.toBase58()}</div>;
}
```

**Link Wallet to User (Auto-linking Hook):**
```typescript
import { useWalletLink } from '@/lib/hooks/useWalletLink';

export default function Dashboard() {
  const { isLinked, isLinking, error } = useWalletLink();
  
  if (isLinking) return <div>Linking wallet...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return <div>Wallet linked: {isLinked ? 'Yes' : 'No'}</div>;
}
```

**Fetch Authenticated Data:**
```typescript
import { usePumpFunLiveStreams } from '@/lib/hooks/usePumpFunLiveStreams';

export default function LiveStreams() {
  const { liveStreams, isLoading, error } = usePumpFunLiveStreams();
  
  if (isLoading) return <div>Loading streams...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      {liveStreams?.map(stream => (
        <div key={stream.mint}>{stream.name}</div>
      ))}
    </div>
  );
}
```

## 📱 Key Pages

- **`/`**: Main social feed with infinite scroll
- **`/auth/signin`**: Authentication page
- **`/auth/onboarding`**: Profile setup after signup
- **`/profile/[username]`**: User profile pages
- **`/post/[id]`**: Individual post view
- **`/create`**: Post creation modal
- **`/leaderboard`**: Top earners leaderboard
- **`/discover`**: User and content discovery
- **`/search`**: Search functionality

## 🎨 Design System

### Color Scheme
- **Primary**: Purple gradient (`#a855f7` to `#ec4899`)
- **Background**: Dark theme (`#0f0f23`)
- **Success Tiers**: Bronze, Silver, Gold, Diamond gradients
- **Earnings**: Green accent for verified earnings

### Components
- **Shadcn/ui**: Base component library
- **Custom Components**: PostCard, EarningsDisplay, VerificationBadge
- **Responsive Design**: Mobile-first approach
- **Animations**: Smooth transitions and loading states

## 🔌 API Integration

### Supabase
- Real-time subscriptions for live updates
- Row Level Security (RLS) for data protection
- Automatic follower count updates
- Post engagement tracking

### Solana Integration
- Wallet connection via Solana Wallet Adapter
- Transaction verification for earnings
- Token balance checking
- Pump.fun program integration

### Clerk Authentication
- Social login providers
- User management
- Session handling
- Profile synchronization

## 🚀 Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables
```env
# Database
DATABASE_URL=your_supabase_database_url
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# File Uploads
UPLOADTHING_SECRET=your_uploadthing_secret
UPLOADTHING_APP_ID=your_uploadthing_app_id

# App Configuration
NEXT_PUBLIC_APP_URL=your_app_url
```

## 📊 Performance Features

- **Infinite Scroll**: Efficient post loading
- **Image Optimization**: Next.js Image component
- **Real-time Updates**: Supabase subscriptions
- **Caching**: React Query for data caching
- **Lazy Loading**: Component-level code splitting

## 🔒 Security

- **Row Level Security**: Database-level access control
- **Input Validation**: Zod schema validation
- **XSS Protection**: Sanitized user inputs
- **CSRF Protection**: Built-in Next.js protection
- **Rate Limiting**: API endpoint protection

## 📈 Analytics & Monitoring

- **User Engagement**: Track likes, comments, shares
- **Earnings Verification**: Monitor verification success rates
- **Performance Metrics**: Page load times, API response times
- **Error Tracking**: Comprehensive error logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email support@flexstream.com or join our Discord community.

---

Built with ❤️ for the Solana and crypto creator community

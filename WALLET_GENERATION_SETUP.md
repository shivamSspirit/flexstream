# Solana Wallet Generation Setup Guide

This guide explains how to set up automatic Solana wallet generation for users signing up with Clerk authentication.

## Overview

The system automatically generates a Solana wallet for each user when they sign up with email/password using Clerk. The wallet's private key is encrypted and stored securely in the database.

## Features

- ✅ Automatic wallet generation during sign-up
- ✅ Secure private key encryption
- ✅ Database storage with Clerk user ID mapping
- ✅ Onboarding page integration
- ✅ API endpoints for wallet management
- ✅ React hooks for easy integration

## Setup Instructions

### 1. Database Migration

Run the following SQL in your Supabase SQL editor:

```sql
-- Add new columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS encrypted_private_key TEXT,
ADD COLUMN IF NOT EXISTS wallet_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS clerk_user_id TEXT UNIQUE;

-- Make wallet_address nullable since it will be generated after signup
ALTER TABLE users ALTER COLUMN wallet_address DROP NOT NULL;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_users_clerk_user_id ON users(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);

-- Add function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

Or use the provided migration file: `apply-wallet-migration.sql`

### 2. Environment Variables

Ensure your `.env.local` file has the required variables:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT for Pump.fun API
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
```

### 3. Dependencies

The following packages are required and should already be installed:

```bash
npm install @solana/web3.js
```

## How It Works

### 1. User Sign-Up Flow

1. User signs up with email/password using Clerk
2. System automatically generates a Solana wallet
3. Private key is encrypted using the user's Clerk ID
4. Wallet data is stored in the database
5. User is redirected to onboarding page

### 2. Wallet Generation Process

```typescript
// 1. Generate new keypair
const keypair = Keypair.generate();

// 2. Get public key
const publicKey = keypair.publicKey.toString();

// 3. Encrypt private key
const encryptedPrivateKey = encryptPrivateKey(
  Buffer.from(keypair.secretKey).toString('base64'),
  userId
);

// 4. Store in database
await supabase.from('users').upsert({
  clerk_user_id: userId,
  wallet_address: publicKey,
  encrypted_private_key: encryptedPrivateKey,
  wallet_created_at: new Date().toISOString()
});
```

### 3. Security Features

- **Private Key Encryption**: Uses AES-256-GCM encryption
- **User-Specific Keys**: Each user's private key is encrypted with their Clerk ID
- **Secure Storage**: Private keys are never sent to the client
- **Database Security**: Row Level Security (RLS) policies protect user data

## API Endpoints

### Generate Wallet
```
POST /api/auth/generate-wallet
```

Generates a new wallet for the authenticated user.

**Response:**
```json
{
  "success": true,
  "wallet": {
    "publicKey": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
  },
  "message": "Wallet generated and stored successfully"
}
```

### Check Wallet Status
```
GET /api/auth/generate-wallet
```

Checks if the authenticated user has a wallet.

**Response:**
```json
{
  "success": true,
  "hasWallet": true,
  "wallet": {
    "publicKey": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## React Hooks

### useWalletGeneration

```typescript
import { useWalletGeneration } from '@/lib/hooks/useWalletGeneration';

function MyComponent() {
  const { 
    generateWallet, 
    autoGenerateWallet,
    isGenerating, 
    hasWallet, 
    wallet, 
    error 
  } = useWalletGeneration();

  const handleGenerate = async () => {
    const result = await generateWallet();
    if (result.success) {
      console.log('Wallet generated:', result.wallet);
    }
  };

  return (
    <div>
      {hasWallet ? (
        <p>Wallet: {wallet?.publicKey}</p>
      ) : (
        <button onClick={handleGenerate} disabled={isGenerating}>
          {isGenerating ? 'Generating...' : 'Generate Wallet'}
        </button>
      )}
    </div>
  );
}
```

## Integration Points

### 1. Sign-Up Page
The sign-up page automatically generates a wallet after successful Clerk authentication.

### 2. Onboarding Page
The onboarding page shows wallet generation status and allows manual generation if needed.

### 3. Profile Management
User profiles now include wallet information and can be updated through the onboarding flow.

## Testing

### Test Page
Visit `/test-wallet` to test wallet generation functionality:

- Check wallet status
- Generate new wallet
- Auto-generate wallet
- View detailed results

### Manual Testing
1. Sign up with a new email
2. Check console logs for wallet generation
3. Verify wallet appears in onboarding page
4. Check database for stored wallet data

## Troubleshooting

### Common Issues

1. **Wallet Generation Fails**
   - Check Clerk authentication
   - Verify database connection
   - Check console logs for errors

2. **Database Errors**
   - Ensure migration has been applied
   - Check RLS policies
   - Verify service role key

3. **Encryption Errors**
   - Check JWT secret configuration
   - Verify encryption function

### Debug Logging

The system includes comprehensive logging:

```typescript
console.log('🔑 [Wallet] Generating new Solana wallet...');
console.log('✅ [Wallet] Wallet generated successfully');
console.log('🔐 [Wallet] Private key encrypted, storing in database...');
```

## Security Considerations

1. **Private Key Protection**
   - Never log private keys
   - Use secure encryption
   - Store encrypted keys only

2. **Database Security**
   - Use RLS policies
   - Limit access to service role
   - Regular security audits

3. **API Security**
   - Authenticate all requests
   - Validate user permissions
   - Rate limit endpoints

## Future Enhancements

- [ ] Wallet import/export functionality
- [ ] Multi-signature wallet support
- [ ] Hardware wallet integration
- [ ] Wallet backup and recovery
- [ ] Transaction history tracking

## Support

For issues or questions:
1. Check the console logs
2. Review the test page at `/test-wallet`
3. Verify database migration
4. Check environment variables

## Files Created/Modified

### New Files
- `lib/solana-wallet.ts` - Wallet generation utilities
- `lib/hooks/useWalletGeneration.ts` - React hook for wallet management
- `app/api/auth/generate-wallet/route.ts` - API endpoint
- `app/test-wallet/page.tsx` - Test page
- `supabase/migrations/002_add_wallet_fields.sql` - Database migration
- `apply-wallet-migration.sql` - Manual migration script

### Modified Files
- `app/auth/onboarding/page.tsx` - Added wallet generation UI
- `app/auth/signup/[[...sign-up]]/page.tsx` - Added auto-generation
- `package.json` - Added @solana/web3.js dependency

This implementation provides a complete, secure, and user-friendly wallet generation system for your FlexStream application.

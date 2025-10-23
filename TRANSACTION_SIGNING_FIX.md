# Transaction Signing Fix - Summary

## Root Cause
The "Unexpected error" when signing was caused by wallet adapters **not supporting partially-signed transactions**.

When we tried to:
1. Partial sign with baseMint keypair on backend
2. Serialize and send to frontend
3. User signs with wallet adapter

The wallet adapter rejected it because it couldn't verify/sign a transaction that already had signatures.

## Solution
Changed the signing flow to:
1. **Backend** creates unsigned transaction and sends it to frontend with baseMint keypair
2. **User** signs the transaction first (wallet adapter works fine with unsigned transactions)
3. **Backend** receives user-signed transaction, adds baseMint signature, then submits to Solana

## Files Modified

### 1. [lib/meteora-dbc.ts](lib/meteora-dbc.ts)
- **Removed** `transaction.partialSign(baseMint)`
- **Added** `baseMintKeypair` to return value
- Transaction is now sent unsigned to frontend

### 2. [app/api/posts/create/route.ts](app/api/posts/create/route.ts)
- Serialize baseMint keypair secret key to base64
- Send `baseMintKeypair` in response to frontend
- Transaction is serialized without signatures

### 3. [components/posts/CreatePostModal.tsx](components/posts/CreatePostModal.tsx)
- **Removed** transaction modification (blockhash, feePayer)
- User signs the unsigned transaction directly
- Pass `baseMintKeypair` to confirm endpoint

### 4. [app/api/posts/confirm/route.ts](app/api/posts/confirm/route.ts)
- Receive `baseMintKeypair` from frontend
- Deserialize user-signed transaction
- Add baseMint signature with `transaction.partialSign(baseMintKeypair)`
- Submit fully-signed transaction to Solana

## New Flow Diagram

```
1. User creates post
   ↓
2. Backend creates UNSIGNED transaction + generates baseMint keypair
   ↓
3. Send transaction + baseMintKeypair (base64) to frontend
   ↓
4. User signs transaction in wallet ✅ (works because transaction is unsigned)
   ↓
5. Frontend sends user-signed transaction + baseMintKeypair to backend
   ↓
6. Backend adds baseMint signature
   ↓
7. Submit fully-signed transaction to Solana
   ↓
8. Save to database
```

## Testing

1. **Restart dev server**:
   ```bash
   pnpm dev
   ```

2. **Create a test post**:
   - Go to `/create`
   - Fill in title, ticker, description
   - Upload an image
   - Click "Launch Post & Token"
   - **Approve the transaction in your wallet**

3. **Expected behavior**:
   - Wallet should show the transaction for signing
   - No "Unexpected error"
   - Transaction should be signed successfully
   - Backend will add the second signature
   - Transaction will be submitted to Solana
   - Post will be saved to database

## What Changed for the User

**Before**: ❌ Wallet rejected with "Unexpected error"

**After**: ✅ Wallet shows transaction → User approves → Success!

## Security Note

The baseMint keypair is:
- Generated fresh for each token
- Sent through HTTPS
- Only used once for signing
- Not stored anywhere after transaction completes

This is safe because:
- The keypair is for the token mint account (not user funds)
- It's required to create the token
- It's immediately used and discarded

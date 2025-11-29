# 🔐 Clerk JWT Authentication Setup Guide

This guide explains how to set up JWT-based authentication for the Pump.fun API using Clerk (email/password authentication) instead of Solana wallet authentication.

## **🚀 Overview**

The new system uses:
- **Clerk** for user authentication (email/password)
- **JWT tokens** generated server-side for Pump.fun API access
- **Automatic token management** with refresh capabilities
- **Secure authentication** without exposing private keys

---

## **📋 Prerequisites**

1. **Clerk Account** - You already have this set up
2. **JWT Secret** - A secure secret key for signing tokens
3. **Environment Variables** - Proper configuration

---

## **⚙️ Environment Setup**

### **Step 1: Add JWT Configuration**

Add these variables to your `.env.local` file:

```bash
# JWT Configuration for Pump.fun API
JWT_SECRET=your_super_secure_jwt_secret_key_here_at_least_32_characters
JWT_EXPIRES_IN=1h

# Pump.fun Configuration (no JWT token needed anymore)
PUMP_FUN_API_BASE_URL=https://frontend-api-v3.pump.fun
NEXT_PUBLIC_PUMP_FUN_PROGRAM_ID=6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P
```

### **Step 2: Generate a Secure JWT Secret**

You can generate a secure JWT secret using:

```bash
# Option 1: Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Option 2: Using OpenSSL
openssl rand -hex 64

# Option 3: Online generator (use with caution)
# Visit: https://generate-secret.vercel.app/64
```

**Example JWT Secret:**
```
JWT_SECRET=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456
```

---

## **🔧 How It Works**

### **Authentication Flow:**

1. **User Signs In** with Clerk (email/password)
2. **JWT Token Generated** server-side for the authenticated user
3. **Token Used** for Pump.fun API requests
4. **Automatic Refresh** when tokens expire

### **API Endpoints:**

- **`POST /api/auth/pump-fun-token`** - Generate JWT token for authenticated user
- **`GET /api/auth/pump-fun-token`** - Check authentication status
- **`GET /api/pump-fun/live-streams`** - Fetch live streams (requires authentication)
- **`GET /api/pump-fun/test`** - Test API connection (requires authentication)

---

## **🚀 Getting Started**

### **Step 1: Configure Environment**

1. Copy the example environment file:
   ```bash
   cp env.example .env.local
   ```

2. Add your JWT secret:
   ```bash
   JWT_SECRET=your_generated_secret_here
   ```

### **Step 2: Start the Development Server**

```bash
pnpm dev
```

### **Step 3: Test Authentication**

1. **Sign up/Sign in** at `http://localhost:3000/auth/signup`
2. **Test API connection** at `http://localhost:3000/api/pump-fun/test`
3. **View live streams** at `http://localhost:3000/live-streams`

---

## **🔍 Testing the Setup**

### **Test 1: Authentication Status**

Visit: `http://localhost:3000/api/pump-fun/test`

**Expected Response (when signed in):**
```json
{
  "success": true,
  "message": "Pump.fun API connection successful!",
  "configured": true,
  "authenticated": true,
  "user_id": "user_abc123",
  "test_data": {
    "coins_fetched": 1,
    "sample_coin": {
      "mint": "token_address",
      "name": "Token Name",
      "symbol": "SYMBOL"
    }
  }
}
```

**Expected Response (when not signed in):**
```json
{
  "success": false,
  "error": "Authentication required. Please sign in to test the Pump.fun API connection.",
  "configured": false,
  "authenticated": false
}
```

### **Test 2: Live Streams Access**

Visit: `http://localhost:3000/live-streams`

- **Signed in**: Shows live streams data
- **Not signed in**: Shows authentication required message

---

## **🛠️ Development Usage**

### **Using the Authentication Hook**

```typescript
import { usePumpFunAuth } from '@/lib/hooks/usePumpFunAuth';

function MyComponent() {
  const { 
    isAuthenticated, 
    isLoading, 
    token, 
    refreshToken 
  } = usePumpFunAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please sign in</div>;

  return <div>Authenticated! Token: {token}</div>;
}
```

### **Making Authenticated Requests**

```typescript
import { usePumpFunRequest } from '@/lib/hooks/usePumpFunAuth';

function MyComponent() {
  const { makeRequest, isAuthenticated } = usePumpFunRequest();

  const fetchData = async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await makeRequest('/api/pump-fun/live-streams');
      const data = await response.json();
      console.log(data);
    } catch (error) {
      console.error('Request failed:', error);
    }
  };

  return <button onClick={fetchData}>Fetch Data</button>;
}
```

---

## **🔒 Security Features**

### **JWT Token Security:**
- ✅ **Signed with secret key** - Tokens can't be forged
- ✅ **Expiration time** - Tokens expire after 1 hour
- ✅ **User-specific** - Each user gets their own token
- ✅ **Server-side generation** - Tokens never exposed to client

### **Authentication Security:**
- ✅ **Clerk integration** - Secure email/password authentication
- ✅ **Automatic token refresh** - Seamless user experience
- ✅ **Error handling** - Clear messages for auth failures
- ✅ **Rate limiting** - Built-in protection against abuse

---

## **🚨 Troubleshooting**

### **Common Issues:**

#### **1. "JWT_SECRET not configured"**
```bash
# Solution: Add JWT_SECRET to .env.local
JWT_SECRET=your_secret_here
```

#### **2. "Authentication required"**
```bash
# Solution: Sign in with Clerk first
# Visit: http://localhost:3000/auth/signin
```

#### **3. "Token expired"**
```bash
# Solution: Tokens auto-refresh, but you can manually refresh:
# The hook will automatically handle this
```

#### **4. "Pump.fun API error"**
```bash
# Solution: Check if Pump.fun API is accessible
# The API might be down or rate-limited
```

### **Debug Steps:**

1. **Check environment variables:**
   ```bash
   echo $JWT_SECRET
   ```

2. **Test authentication:**
   ```bash
   curl http://localhost:3000/api/pump-fun/test
   ```

3. **Check Clerk configuration:**
   - Verify Clerk keys in `.env.local`
   - Check Clerk dashboard for user status

4. **Check server logs:**
   ```bash
   # Look for JWT-related errors in the console
   ```

---

## **📊 API Response Examples**

### **Successful Token Generation:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "1h",
  "userId": "user_abc123",
  "message": "Token generated successfully for Pump.fun API access"
}
```

### **Live Streams Data:**
```json
{
  "success": true,
  "data": [
    {
      "mint": "token_address",
      "name": "Token Name",
      "symbol": "SYMBOL",
      "market_cap": 1000000,
      "price_usd": 0.001,
      "volume_24h": 50000,
      "is_live_streaming": true
    }
  ],
  "count": 1,
  "timestamp": 1703123456789,
  "source": "pump.fun-api"
}
```

---

## **🎯 Next Steps**

1. **Set up your JWT secret** in `.env.local`
2. **Test the authentication flow** with sign up/sign in
3. **Verify API access** with the test endpoint
4. **Explore live streams** with the authenticated user
5. **Customize the UI** as needed for your use case

---

## **📚 Additional Resources**

- [Clerk Documentation](https://clerk.com/docs)
- [JWT.io](https://jwt.io/) - JWT token debugger
- [Pump.fun API Documentation](https://github.com/BankkRoll/pumpfun-apis)

---

**🎉 You're all set! The JWT authentication system is now ready to use with Clerk!**

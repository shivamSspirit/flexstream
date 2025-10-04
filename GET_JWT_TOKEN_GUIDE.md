# 🔑 How to Get Your Pump.fun JWT Token

## **Quick Steps Overview**

1. **Get a nonce** from Pump.fun API
2. **Sign the nonce** with your Solana wallet
3. **Verify the signature** to get your JWT token
4. **Add the token** to your `.env.local` file

---

## **Step-by-Step Guide**

### **Step 1: Get a Nonce**

Open your terminal and run this command (replace `YOUR_WALLET_ADDRESS` with your actual Solana wallet address):

```bash
curl -X POST "https://frontend-api-v3.pump.fun/user/nonce" \
  -H "Content-Type: application/json" \
  -d '{
    "wallet_address": "YOUR_WALLET_ADDRESS"
  }'
```

**Example Response:**
```json
{
  "nonce": "abc123def456ghi789"
}
```

**Copy the nonce value!** You'll need it for the next step.

### **Step 2: Sign the Nonce with Your Wallet**

1. **Open your Solana wallet** (Phantom, Solflare, etc.)
2. **Create a message to sign:**
   ```
   I'm signing my one-time nonce: abc123def456ghi789
   ```
   (Replace `abc123def456ghi789` with your actual nonce)

3. **Sign this message** in your wallet
4. **Copy the signature** that your wallet generates

### **Step 3: Verify the Signature**

Run this command with your actual values:

```bash
curl -X POST "https://frontend-api-v3.pump.fun/user/verify" \
  -H "Content-Type: application/json" \
  -d '{
    "wallet_address": "YOUR_WALLET_ADDRESS",
    "signature": "YOUR_SIGNATURE_FROM_WALLET",
    "nonce": "YOUR_NONCE_FROM_STEP_1"
  }'
```

**Example Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "refresh_token_here",
  "expires_in": 3600
}
```

### **Step 4: Add Token to Your Project**

1. **Copy the `access_token`** from the response
2. **Add it to your `.env.local` file:**

```bash
# Pump.fun Configuration
PUMP_FUN_JWT_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
PUMP_FUN_API_BASE_URL=https://frontend-api-v3.pump.fun
NEXT_PUBLIC_PUMP_FUN_PROGRAM_ID=6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P
```

3. **Restart your development server:**
   ```bash
   pnpm dev
   ```

4. **Test the connection:**
   Visit `http://localhost:3000/api/pump-fun/test`

---

## **Alternative: Using Browser Developer Tools**

If you prefer using the browser:

### **Step 1: Open Browser Developer Tools**
1. Go to `https://pump.fun` in your browser
2. Open Developer Tools (F12)
3. Go to the **Console** tab

### **Step 2: Get Nonce**
Paste this code in the console:

```javascript
fetch('https://frontend-api-v3.pump.fun/user/nonce', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    wallet_address: 'YOUR_WALLET_ADDRESS'
  })
})
.then(response => response.json())
.then(data => {
  console.log('Nonce:', data.nonce);
  window.pumpNonce = data.nonce;
});
```

### **Step 3: Sign with Wallet**
Connect your wallet and sign the message:
```
I'm signing my one-time nonce: [nonce_from_step_2]
```

### **Step 4: Verify Signature**
Paste this in the console (replace with your actual signature):

```javascript
fetch('https://frontend-api-v3.pump.fun/user/verify', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    wallet_address: 'YOUR_WALLET_ADDRESS',
    signature: 'YOUR_SIGNATURE',
    nonce: window.pumpNonce
  })
})
.then(response => response.json())
.then(data => {
  console.log('JWT Token:', data.access_token);
});
```

---

## **Troubleshooting**

### **Common Issues:**

1. **"Invalid wallet address"**
   - Make sure you're using a valid Solana wallet address
   - Check that the address starts with a letter and is 32-44 characters long

2. **"Invalid signature"**
   - Make sure you signed the exact message format
   - Check that the nonce matches what you received

3. **"Token expired"**
   - JWT tokens typically expire after 1 hour
   - You'll need to repeat the process to get a new token

4. **"API not responding"**
   - Check your internet connection
   - The Pump.fun API might be temporarily down

### **Testing Your Token:**

Once you have your token, test it:

```bash
curl -X GET "https://frontend-api-v3.pump.fun/coins/currently-live?limit=1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

If you get a successful response, your token is working! 🎉

---

## **Security Notes**

- ⚠️ **Never share your JWT token publicly**
- ⚠️ **Don't commit it to version control**
- ⚠️ **Store it only in environment variables**
- ⚠️ **Tokens expire, so you may need to refresh them periodically**

---

## **Need Help?**

If you're still having trouble:

1. Check the [Pump.fun API documentation](https://github.com/BankkRoll/pumpfun-apis)
2. Make sure you have a valid Solana wallet
3. Try the browser method if the terminal method doesn't work
4. Check that your wallet address is correct

Good luck! 🚀

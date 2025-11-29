# Pump.fun API Setup Guide

This guide will help you set up the Pump.fun API integration with JWT authentication.

## 🔑 Getting Your JWT Token

### Step 1: Access Pump.fun API
1. Visit the [Pump.fun API documentation](https://github.com/BankkRoll/pumpfun-apis)
2. Follow their authentication process to obtain a JWT token
3. The token is required for all API requests to `https://frontend-api-v3.pump.fun`

### Step 2: Configure Environment Variables

Add the following variables to your `.env.local` file:

```bash
# Pump.fun Configuration
PUMP_FUN_JWT_TOKEN=your_actual_jwt_token_here
PUMP_FUN_API_BASE_URL=https://frontend-api-v3.pump.fun
NEXT_PUBLIC_PUMP_FUN_PROGRAM_ID=6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P
```

### Step 3: Test the Configuration

1. Start your development server:
   ```bash
   pnpm dev
   ```

2. Visit `/live-streams` to test the integration

3. Check the browser console and server logs for any authentication errors

## 🔧 API Endpoints

### Currently Live Coins
- **Endpoint:** `GET /api/pump-fun/live-streams`
- **Parameters:**
  - `limit` (default: 10) - Number of coins to fetch
  - `offset` (default: 0) - Pagination offset
  - `includeNsfw` (default: false) - Include NSFW content
  - `order` (default: DESC) - Sort order (ASC/DESC)

### Example Request
```bash
curl -X GET "http://localhost:3000/api/pump-fun/live-streams?limit=20&offset=0&includeNsfw=false&order=DESC"
```

### Filtered Live Coins
- **Endpoint:** `POST /api/pump-fun/live-streams`
- **Body:**
```json
{
  "filters": {
    "min_market_cap": 1000,
    "max_market_cap": 100000,
    "min_volume_24h": 500,
    "platform": "twitch",
    "verified_streamers_only": true
  },
  "limit": 50,
  "offset": 0,
  "includeNsfw": false,
  "order": "DESC"
}
```

## 🚨 Troubleshooting

### Authentication Errors
If you see "Pump.fun API authentication not configured":
1. Check that `PUMP_FUN_JWT_TOKEN` is set in your `.env.local` file
2. Restart your development server after adding the token
3. Verify the token is valid and not expired

### API Errors
If you see HTTP 401 or 403 errors:
1. Your JWT token may be expired or invalid
2. Contact Pump.fun support to get a new token
3. Check the Pump.fun API documentation for rate limits

### WebSocket Connection Issues
If real-time updates aren't working:
1. Check your network connection
2. Verify the WebSocket URL is accessible
3. Check browser console for WebSocket errors

## 📊 Features

### Real-time Data
- ✅ WebSocket connection for live updates
- ✅ Automatic reconnection on connection loss
- ✅ Real-time trade and token creation notifications

### Filtering & Sorting
- ✅ Filter by platform (Twitch, YouTube, Kick, etc.)
- ✅ Market cap and volume ranges
- ✅ Price change direction
- ✅ Verified streamers only
- ✅ Sort by viewers, market cap, volume, or price change

### UI Components
- ✅ Live stream cards with real-time data
- ✅ Connection status indicators
- ✅ Loading states and error handling
- ✅ Mobile responsive design

## 🔒 Security Notes

- Never commit your JWT token to version control
- Use environment variables for all sensitive configuration
- The token should be kept secure and rotated regularly
- Consider implementing token refresh logic for production

## 📝 API Response Format

```json
{
  "success": true,
  "data": [
    {
      "mint": "token_address",
      "name": "Token Name",
      "symbol": "SYMBOL",
      "description": "Token description",
      "image_uri": "https://...",
      "market_cap": 1000000,
      "price_usd": 0.001,
      "volume_24h": 50000,
      "price_change_24h": 15.5,
      "is_live_streaming": true,
      "streamer_info": {
        "username": "streamer_name",
        "display_name": "Streamer Display Name",
        "followers_count": 1000
      }
    }
  ],
  "count": 1,
  "timestamp": 1703123456789,
  "source": "pump.fun-api"
}
```

## 🚀 Next Steps

1. Set up your JWT token
2. Test the `/live-streams` page
3. Customize the UI components as needed
4. Add additional filtering options
5. Implement user preferences for saved filters

For more information, refer to the [Pump.fun API documentation](https://github.com/BankkRoll/pumpfun-apis).

import { NextRequest } from 'next/server';

// WebSocket endpoint description (HTTP only)
export async function GET(request: NextRequest) {
  // This would typically be handled by a WebSocket server
  // For now, we'll return instructions for WebSocket implementation
  
  return new Response(JSON.stringify({
    message: 'WebSocket endpoint for real-time Pump.fun data',
    websocket_url: 'wss://rpc.api-pump.fun/ws',
    available_subscriptions: [
      'subscribeTrades',
      'subscribeNewTokens', 
      'subscribePublications',
      'subscribeLiquidityChanges'
    ],
    example_usage: {
      connect: 'wss://rpc.api-pump.fun/ws',
      subscribe_trades: {
        method: 'subscribeTrades',
        params: []
      },
      subscribe_new_tokens: {
        method: 'subscribeNewTokens',
        params: []
      }
    }
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}


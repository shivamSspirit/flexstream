/**
 * FlexIt WebSocket Manager
 *
 * Real-time price updates via Helius Geyser
 * - Account updates (pool state changes)
 * - Transaction confirmations
 * - Block updates
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { EXECUTION_CONFIG } from './config';

export type SubscriptionCallback = (data: any) => void;

export interface PriceUpdate {
  tokenMint: string;
  poolAddress: string;
  price: number;
  baseReserve: number;
  quoteReserve: number;
  marketCap: number;
  liquidity: number;
  timestamp: number;
}

export interface TransactionUpdate {
  signature: string;
  status: 'confirmed' | 'finalized' | 'failed';
  slot: number;
  timestamp: number;
  error?: string;
}

/**
 * WebSocket Manager for real-time updates
 */
export class WebSocketManager {
  private ws: WebSocket | null = null;
  private connection: Connection;
  private subscriptions: Map<string, Set<SubscriptionCallback>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private shouldReconnect = true;

  constructor(connection?: Connection) {
    this.connection = connection || new Connection(
      EXECUTION_CONFIG.rpc.helius.mainnet!,
      EXECUTION_CONFIG.rpc.commitment
    );
  }

  /**
   * Connect to WebSocket
   */
  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      console.log('[WebSocket] Already connected or connecting');
      return;
    }

    this.isConnecting = true;

    try {
      const wsUrl = EXECUTION_CONFIG.rpc.helius.websocket;
      if (!wsUrl) {
        throw new Error('WebSocket URL not configured');
      }

      console.log('[WebSocket] Connecting to:', wsUrl);

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[WebSocket] Connected successfully');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
      };

      this.ws.onclose = () => {
        console.log('[WebSocket] Connection closed');
        this.isConnecting = false;
        this.stopHeartbeat();

        if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
          console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
          setTimeout(() => this.connect(), delay);
        }
      };
    } catch (error) {
      console.error('[WebSocket] Connection failed:', error);
      this.isConnecting = false;
      throw error;
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    console.log('[WebSocket] Disconnecting...');
    this.shouldReconnect = false;
    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.subscriptions.clear();
  }

  /**
   * Subscribe to pool price updates
   */
  subscribeToPool(poolAddress: PublicKey, callback: (update: PriceUpdate) => void): () => void {
    const key = `pool:${poolAddress.toBase58()}`;

    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, new Set());
    }

    this.subscriptions.get(key)!.add(callback);

    // Subscribe via Solana RPC (account subscription)
    const subscriptionId = this.connection.onAccountChange(
      poolAddress,
      async (accountInfo) => {
        try {
          // Parse pool account data
          // This would need proper DBC pool state deserialization
          // For now, we'll emit a basic update

          const update: PriceUpdate = {
            tokenMint: '', // Would parse from account data
            poolAddress: poolAddress.toBase58(),
            price: 0, // Would calculate from reserves
            baseReserve: 0,
            quoteReserve: 0,
            marketCap: 0,
            liquidity: 0,
            timestamp: Date.now(),
          };

          // Notify all subscribers
          this.subscriptions.get(key)?.forEach(cb => cb(update));
        } catch (error) {
          console.error('[WebSocket] Error processing pool update:', error);
        }
      },
      EXECUTION_CONFIG.rpc.commitment
    );

    console.log('[WebSocket] Subscribed to pool:', poolAddress.toBase58());

    // Return unsubscribe function
    return () => {
      this.subscriptions.get(key)?.delete(callback);
      if (this.subscriptions.get(key)?.size === 0) {
        this.subscriptions.delete(key);
        this.connection.removeAccountChangeListener(subscriptionId);
        console.log('[WebSocket] Unsubscribed from pool:', poolAddress.toBase58());
      }
    };
  }

  /**
   * Subscribe to transaction confirmations
   */
  subscribeToTransaction(
    signature: string,
    callback: (update: TransactionUpdate) => void
  ): () => void {
    const key = `tx:${signature}`;

    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, new Set());
    }

    this.subscriptions.get(key)!.add(callback);

    // Subscribe via Solana RPC (signature subscription)
    const subscriptionId = this.connection.onSignature(
      signature,
      (result, context) => {
        const update: TransactionUpdate = {
          signature,
          status: result.err ? 'failed' : 'confirmed',
          slot: context.slot,
          timestamp: Date.now(),
          error: result.err ? JSON.stringify(result.err) : undefined,
        };

        // Notify all subscribers
        this.subscriptions.get(key)?.forEach(cb => cb(update));

        // Auto-cleanup after confirmation
        setTimeout(() => {
          this.subscriptions.delete(key);
        }, 5000);
      },
      EXECUTION_CONFIG.rpc.commitment
    );

    console.log('[WebSocket] Subscribed to transaction:', signature);

    // Return unsubscribe function
    return () => {
      this.subscriptions.get(key)?.delete(callback);
      if (this.subscriptions.get(key)?.size === 0) {
        this.subscriptions.delete(key);
        this.connection.removeSignatureListener(subscriptionId);
        console.log('[WebSocket] Unsubscribed from transaction:', signature);
      }
    };
  }

  /**
   * Subscribe to block updates (for timing/latency monitoring)
   */
  subscribeToBlocks(callback: (slot: number) => void): () => void {
    const key = 'blocks';

    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, new Set());
    }

    this.subscriptions.get(key)!.add(callback);

    // Subscribe via Solana RPC (slot subscription)
    const subscriptionId = this.connection.onSlotChange((slotInfo) => {
      this.subscriptions.get(key)?.forEach(cb => cb(slotInfo.slot));
    });

    console.log('[WebSocket] Subscribed to blocks');

    // Return unsubscribe function
    return () => {
      this.subscriptions.get(key)?.delete(callback);
      if (this.subscriptions.get(key)?.size === 0) {
        this.subscriptions.delete(key);
        this.connection.removeSlotChangeListener(subscriptionId);
        console.log('[WebSocket] Unsubscribed from blocks');
      }
    };
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);

      // Route message to appropriate subscribers
      if (message.method === 'accountNotification') {
        // Handle account updates
        const accountKey = `account:${message.params?.result?.value?.pubkey}`;
        this.subscriptions.get(accountKey)?.forEach(cb => cb(message.params?.result));
      } else if (message.method === 'signatureNotification') {
        // Handle transaction updates
        const txKey = `tx:${message.params?.subscription}`;
        this.subscriptions.get(txKey)?.forEach(cb => cb(message.params?.result));
      } else if (message.method === 'slotNotification') {
        // Handle block updates
        this.subscriptions.get('blocks')?.forEach(cb => cb(message.params?.result?.slot));
      }
    } catch (error) {
      console.error('[WebSocket] Error parsing message:', error);
    }
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ method: 'ping' }));
      }
    }, 30000); // Ping every 30 seconds
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Get number of active subscriptions
   */
  getSubscriptionCount(): number {
    return Array.from(this.subscriptions.values())
      .reduce((total, set) => total + set.size, 0);
  }
}

/**
 * Singleton instance
 */
let wsManager: WebSocketManager | null = null;

/**
 * Get or create WebSocket manager instance
 */
export function getWebSocketManager(connection?: Connection): WebSocketManager {
  if (!wsManager) {
    wsManager = new WebSocketManager(connection);
  }
  return wsManager;
}

/**
 * React hook for WebSocket price updates
 */
export function usePriceUpdates(poolAddress?: string) {
  // This would be implemented as a React hook
  // For now, just export the function
  return {
    price: 0,
    isConnected: false,
    subscribe: () => {},
    unsubscribe: () => {},
  };
}

export default WebSocketManager;

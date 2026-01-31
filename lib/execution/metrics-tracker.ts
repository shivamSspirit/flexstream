/**
 * FlexIt Execution Metrics Tracker
 *
 * Tracks and analyzes execution performance:
 * - Success rates
 * - Execution times
 * - Price impacts
 * - Route performance
 * - Cost analysis
 */

import { SwapExecutionResult, SwapQuote, ExecutionMetrics } from './types';
import { EXECUTION_CONFIG } from './config';

export interface ExecutionLog {
  id: string;
  timestamp: number;
  userId?: string;
  tokenMint: string;
  poolAddress?: string;
  direction: 'BUY' | 'SELL';
  route: 'DIRECT_DBC' | 'JUPITER' | 'HYBRID';

  // Input
  amountIn: string;
  amountInUSD?: number;

  // Output
  amountOut?: string;
  amountOutUSD?: number;

  // Execution
  success: boolean;
  executionTimeMs: number;
  signature?: string;
  bundleId?: string;
  blockNumber?: number;

  // Costs
  gasFee?: number;
  jitoTip?: number;
  platformFee?: number;
  totalCost?: number;

  // Performance
  priceImpactBps?: number;
  slippageBps?: number;
  expectedAmountOut?: string;
  slippageExceeded?: boolean;

  // Routing
  useJito: boolean;
  priority: string;
  routingReason?: string;

  // Error (if failed)
  error?: string;
  errorCode?: string;
}

/**
 * Metrics Tracker
 * Collects and analyzes execution data
 */
export class MetricsTracker {
  private logs: ExecutionLog[] = [];
  private maxLogs = 10000; // Keep last 10k logs in memory

  constructor() {
    if (EXECUTION_CONFIG.monitoring.enabled) {
      console.log('[Metrics] Tracker initialized');
    }
  }

  /**
   * Log a swap execution
   */
  logExecution(data: {
    quote: SwapQuote;
    result: SwapExecutionResult;
    userId?: string;
    tokenMint: string;
    poolAddress?: string;
    direction: 'BUY' | 'SELL';
    useJito: boolean;
    priority: string;
  }): void {
    if (!EXECUTION_CONFIG.monitoring.enabled) {
      return;
    }

    const log: ExecutionLog = {
      id: `exec-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: Date.now(),
      userId: data.userId,
      tokenMint: data.tokenMint,
      poolAddress: data.poolAddress,
      direction: data.direction,
      route: data.quote.route,

      // Input
      amountIn: data.quote.amountIn.toString(),

      // Output
      amountOut: data.result.actualAmountOut?.toString(),

      // Execution
      success: data.result.success,
      executionTimeMs: data.result.executionTimeMs,
      signature: data.result.signature,
      bundleId: data.result.bundleId,
      blockNumber: data.result.blockNumber,

      // Costs
      gasFee: data.result.gasFee,
      jitoTip: data.result.jitoTip,
      totalCost: (data.result.gasFee || 0) + (data.result.jitoTip || 0),

      // Performance
      priceImpactBps: data.quote.priceImpactBps,
      expectedAmountOut: data.quote.amountOut.toString(),

      // Routing
      useJito: data.useJito,
      priority: data.priority,

      // Error
      error: data.result.error,
    };

    // Add to logs
    this.logs.push(log);

    // Trim if needed
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Log to console if enabled
    if (EXECUTION_CONFIG.monitoring.logLevel === 'debug') {
      console.log('[Metrics] Execution logged:', log);
    }

    // Send to analytics if enabled
    if (EXECUTION_CONFIG.monitoring.sendToAnalytics) {
      this.sendToAnalytics(log);
    }
  }

  /**
   * Get execution metrics for a time period
   */
  getMetrics(period: '1h' | '24h' | '7d' | '30d' | 'all' = '24h'): ExecutionMetrics {
    const now = Date.now();
    const periodMs = this.getPeriodMs(period);
    const cutoff = period === 'all' ? 0 : now - periodMs;

    // Filter logs for period
    const periodLogs = this.logs.filter(log => log.timestamp >= cutoff);

    if (periodLogs.length === 0) {
      return this.getEmptyMetrics(period);
    }

    // Calculate metrics
    const totalSwaps = periodLogs.length;
    const successfulSwaps = periodLogs.filter(log => log.success).length;
    const failedSwaps = totalSwaps - successfulSwaps;

    const successfulLogs = periodLogs.filter(log => log.success);

    const avgExecutionTimeMs = successfulLogs.length > 0
      ? successfulLogs.reduce((sum, log) => sum + log.executionTimeMs, 0) / successfulLogs.length
      : 0;

    const avgPriceImpactBps = successfulLogs.length > 0
      ? successfulLogs.reduce((sum, log) => sum + (log.priceImpactBps || 0), 0) / successfulLogs.length
      : 0;

    const totalVolumeUSD = successfulLogs.reduce((sum, log) =>
      sum + (log.amountInUSD || 0), 0
    );

    const totalFeesLamports = successfulLogs.reduce((sum, log) =>
      sum + (log.totalCost || 0), 0
    );

    return {
      totalSwaps,
      successfulSwaps,
      failedSwaps,
      avgExecutionTimeMs: Math.round(avgExecutionTimeMs),
      avgPriceImpactBps: Math.round(avgPriceImpactBps),
      totalVolumeUSD: Math.round(totalVolumeUSD),
      totalFeesLamports,
      period,
      updatedAt: now,
    };
  }

  /**
   * Get route-specific performance
   */
  getRoutePerformance(period: '1h' | '24h' | '7d' | '30d' | 'all' = '24h') {
    const now = Date.now();
    const periodMs = this.getPeriodMs(period);
    const cutoff = period === 'all' ? 0 : now - periodMs;

    const periodLogs = this.logs.filter(log => log.timestamp >= cutoff && log.success);

    const routes = ['DIRECT_DBC', 'JUPITER'] as const;
    const performance: Record<string, {
      count: number;
      avgExecutionMs: number;
      avgPriceImpactBps: number;
      successRate: number;
    }> = {};

    routes.forEach(route => {
      const routeLogs = periodLogs.filter(log => log.route === route);
      const routeAllLogs = this.logs.filter(log =>
        log.timestamp >= cutoff && log.route === route
      );

      performance[route] = {
        count: routeLogs.length,
        avgExecutionMs: routeLogs.length > 0
          ? Math.round(routeLogs.reduce((sum, log) => sum + log.executionTimeMs, 0) / routeLogs.length)
          : 0,
        avgPriceImpactBps: routeLogs.length > 0
          ? Math.round(routeLogs.reduce((sum, log) => sum + (log.priceImpactBps || 0), 0) / routeLogs.length)
          : 0,
        successRate: routeAllLogs.length > 0
          ? routeLogs.length / routeAllLogs.length * 100
          : 0,
      };
    });

    return performance;
  }

  /**
   * Get recent executions
   */
  getRecentExecutions(limit: number = 50): ExecutionLog[] {
    return this.logs.slice(-limit).reverse();
  }

  /**
   * Get failure analysis
   */
  getFailureAnalysis(period: '1h' | '24h' | '7d' | '30d' | 'all' = '24h') {
    const now = Date.now();
    const periodMs = this.getPeriodMs(period);
    const cutoff = period === 'all' ? 0 : now - periodMs;

    const failedLogs = this.logs.filter(log =>
      log.timestamp >= cutoff && !log.success
    );

    // Group by error
    const errorCounts: Record<string, number> = {};
    failedLogs.forEach(log => {
      const error = log.error || 'Unknown error';
      errorCounts[error] = (errorCounts[error] || 0) + 1;
    });

    // Group by route
    const routeFailures: Record<string, number> = {};
    failedLogs.forEach(log => {
      routeFailures[log.route] = (routeFailures[log.route] || 0) + 1;
    });

    return {
      totalFailures: failedLogs.length,
      errorCounts,
      routeFailures,
      recentFailures: failedLogs.slice(-10).reverse(),
    };
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.logs = [];
    console.log('[Metrics] Logs cleared');
  }

  /**
   * Send metrics to analytics backend
   */
  private async sendToAnalytics(log: ExecutionLog): Promise<void> {
    try {
      // In production, send to your analytics service
      // For now, just log
      if (EXECUTION_CONFIG.monitoring.logLevel === 'debug') {
        console.log('[Metrics] Would send to analytics:', log.id);
      }

      // Example: Send to your backend
      // await fetch('/api/analytics/execution', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(log),
      // });
    } catch (error) {
      console.error('[Metrics] Failed to send to analytics:', error);
    }
  }

  /**
   * Get period in milliseconds
   */
  private getPeriodMs(period: '1h' | '24h' | '7d' | '30d' | 'all'): number {
    switch (period) {
      case '1h': return 60 * 60 * 1000;
      case '24h': return 24 * 60 * 60 * 1000;
      case '7d': return 7 * 24 * 60 * 60 * 1000;
      case '30d': return 30 * 24 * 60 * 60 * 1000;
      case 'all': return Infinity;
    }
  }

  /**
   * Get empty metrics
   */
  private getEmptyMetrics(period: string): ExecutionMetrics {
    return {
      totalSwaps: 0,
      successfulSwaps: 0,
      failedSwaps: 0,
      avgExecutionTimeMs: 0,
      avgPriceImpactBps: 0,
      totalVolumeUSD: 0,
      totalFeesLamports: 0,
      period: period as any,
      updatedAt: Date.now(),
    };
  }
}

/**
 * Singleton instance
 */
let metricsTracker: MetricsTracker | null = null;

/**
 * Get or create metrics tracker instance
 */
export function getMetricsTracker(): MetricsTracker {
  if (!metricsTracker) {
    metricsTracker = new MetricsTracker();
  }
  return metricsTracker;
}

export default MetricsTracker;

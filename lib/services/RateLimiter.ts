/**
 * Rate Limiter Service
 * Ensures API calls respect rate limits
 * Uses token bucket algorithm with queue
 */

interface QueuedRequest<T> {
  fn: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: any) => void;
  priority: number;
}

export class RateLimiter {
  private queue: QueuedRequest<any>[] = [];
  private processing = false;
  private lastRequestTime = 0;
  private readonly minInterval: number;

  constructor(requestsPerSecond: number = 1) {
    this.minInterval = 1000 / requestsPerSecond;
  }

  /**
   * Schedule a function to run with rate limiting
   * @param fn Function to execute
   * @param priority Higher priority gets executed first (default: 0)
   */
  async schedule<T>(fn: () => Promise<T>, priority: number = 0): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject, priority });

      // Sort queue by priority (higher first)
      this.queue.sort((a, b) => b.priority - a.priority);

      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  private async processQueue() {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }

    this.processing = true;

    // Wait if needed to respect rate limit
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.minInterval) {
      await new Promise(resolve =>
        setTimeout(resolve, this.minInterval - timeSinceLastRequest)
      );
    }

    // Execute next request
    const request = this.queue.shift();
    if (!request) {
      this.processing = false;
      return;
    }

    this.lastRequestTime = Date.now();

    try {
      const result = await request.fn();
      request.resolve(result);
    } catch (error) {
      request.reject(error);
    }

    // Process next item
    this.processQueue();
  }

  /**
   * Get current queue length
   */
  getQueueLength(): number {
    return this.queue.length;
  }

  /**
   * Clear all pending requests
   */
  clearQueue() {
    this.queue.forEach(req =>
      req.reject(new Error('Queue cleared'))
    );
    this.queue = [];
    this.processing = false;
  }
}

// Singleton instance for DexScreener API (5 RPS)
export const dexscreenerRateLimiter = new RateLimiter(5);

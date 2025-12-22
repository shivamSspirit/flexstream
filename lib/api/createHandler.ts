/**
 * API Handler Factory
 * Wraps API routes with standard error handling, logging, and response formatting
 * Pragmatic Programmer: Reduce duplication, increase consistency
 */

import { NextRequest, NextResponse } from 'next/server';
import { AppError, ErrorCode } from '@/lib/errors/AppError';
import * as response from './response';

type HandlerFunction<T = any> = (
  request: NextRequest,
  context?: { params: Record<string, string> }
) => Promise<T> | T;

interface HandlerOptions {
  /**
   * Require authentication (wallet address in header)
   */
  requireAuth?: boolean;
  
  /**
   * Custom error handler
   */
  onError?: (error: Error) => void;
  
  /**
   * Enable request logging
   */
  logRequests?: boolean;
}

/**
 * Create an API handler with automatic error handling
 * 
 * @example
 * export const GET = createHandler(async (request) => {
 *   const posts = await PostRepository.findAll();
 *   return { posts };
 * });
 */
export function createHandler<T = any>(
  handler: HandlerFunction<T>,
  options: HandlerOptions = {}
) {
  return async (
    request: NextRequest,
    context?: { params: Record<string, string> }
  ): Promise<NextResponse> => {
    const startTime = Date.now();
    
    try {
      // Log request if enabled
      if (options.logRequests !== false) {
        console.log(`[${request.method}] ${request.url}`);
      }

      // Check authentication if required
      if (options.requireAuth) {
        const wallet = request.headers.get('x-wallet-address');
        if (!wallet) {
          throw new AppError(
            ErrorCode.UNAUTHORIZED,
            'Wallet address required',
            401
          );
        }
      }

      // Execute handler
      const data = await handler(request, context);

      // Log success
      const duration = Date.now() - startTime;
      if (options.logRequests !== false) {
        console.log(`[${request.method}] ${request.url} - ${duration}ms`);
      }

      // Return success response
      return response.success(data);

    } catch (err) {
      // Log error
      console.error(`[${request.method}] ${request.url} - Error:`, err);

      // Call custom error handler if provided
      if (options.onError) {
        options.onError(err as Error);
      }

      // Handle AppError
      if (err instanceof AppError) {
        return response.error(err);
      }

      // Handle unknown errors
      const message = err instanceof Error ? err.message : 'Internal server error';
      return response.errorResponse(message, 500);
    }
  };
}

/**
 * Shorthand for creating authenticated handlers
 */
export function createAuthHandler<T = any>(handler: HandlerFunction<T>) {
  return createHandler(handler, { requireAuth: true });
}

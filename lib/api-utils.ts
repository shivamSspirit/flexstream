/**
 * API Utilities
 * Provides consistent error handling and response formatting for API routes
 * Follows DRY and Single Responsibility principles
 */

import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ERROR_MESSAGES } from '@/lib/constants';

// ============================================================================
// TYPES
// ============================================================================

export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: any;
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

// ============================================================================
// RESPONSE HELPERS
// ============================================================================

/**
 * Creates a successful API response
 */
export function successResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message }),
    },
    { status }
  );
}

/**
 * Creates an error API response
 */
export function errorResponse(
  error: string,
  status: number = 500,
  details?: any
): NextResponse<ApiErrorResponse> {
  console.error('API Error:', error, details);

  return NextResponse.json(
    {
      success: false,
      error,
      ...(details && process.env.NODE_ENV === 'development' && { details }),
    },
    { status }
  );
}

/**
 * Creates a validation error response
 */
export function validationError(
  message: string,
  details?: any
): NextResponse<ApiErrorResponse> {
  return errorResponse(message, 400, details);
}

/**
 * Creates an unauthorized error response
 */
export function unauthorizedError(
  message: string = 'Unauthorized'
): NextResponse<ApiErrorResponse> {
  return errorResponse(message, 401);
}

/**
 * Creates a not found error response
 */
export function notFoundError(
  message: string = 'Resource not found'
): NextResponse<ApiErrorResponse> {
  return errorResponse(message, 404);
}

// ============================================================================
// SUPABASE CLIENT INITIALIZATION
// ============================================================================

/**
 * Initializes Supabase client for API routes
 * Throws error if not configured properly
 */
export function initializeSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(ERROR_MESSAGES.SUPABASE_NOT_CONFIGURED);
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// ============================================================================
// REQUEST VALIDATION
// ============================================================================

/**
 * Validates required fields in request body
 * Returns validation error response if any field is missing
 */
export function validateRequiredFields(
  body: any,
  requiredFields: string[]
): NextResponse<ApiErrorResponse> | null {
  const missingFields = requiredFields.filter((field) => !body[field]);

  if (missingFields.length > 0) {
    return validationError(
      `Missing required fields: ${missingFields.join(', ')}`,
      { missingFields }
    );
  }

  return null;
}

/**
 * Validates request method
 */
export function validateMethod(
  request: Request,
  allowedMethods: string[]
): NextResponse<ApiErrorResponse> | null {
  if (!allowedMethods.includes(request.method)) {
    return errorResponse(
      `Method ${request.method} not allowed`,
      405
    );
  }

  return null;
}

// ============================================================================
// ERROR HANDLING WRAPPER
// ============================================================================

/**
 * Wraps an API route handler with error handling
 * Catches all errors and returns consistent error responses
 */
export function withErrorHandling(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      return await handler(request);
    } catch (error) {
      console.error('Unhandled API error:', error);

      if (error instanceof Error) {
        // Known error types
        if (error.message.includes('not found')) {
          return notFoundError(error.message);
        }

        if (error.message.includes('unauthorized')) {
          return unauthorizedError(error.message);
        }

        if (error.message.includes('validation')) {
          return validationError(error.message);
        }

        // Generic error
        return errorResponse(
          error.message || ERROR_MESSAGES.SOMETHING_WENT_WRONG,
          500,
          process.env.NODE_ENV === 'development' ? error.stack : undefined
        );
      }

      // Unknown error type
      return errorResponse(ERROR_MESSAGES.SOMETHING_WENT_WRONG);
    }
  };
}

// ============================================================================
// PAGINATION HELPERS
// ============================================================================

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

/**
 * Parses pagination parameters from URL
 */
export function parsePaginationParams(
  searchParams: URLSearchParams,
  defaultLimit: number = 20,
  maxLimit: number = 100
): Required<PaginationParams> {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(
    maxLimit,
    Math.max(1, parseInt(searchParams.get('limit') || String(defaultLimit), 10))
  );

  return { page, limit };
}

/**
 * Creates a paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / limit);
  const hasMore = page < totalPages;

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore,
    },
  };
}

// ============================================================================
// FILE UPLOAD HELPERS
// ============================================================================

/**
 * Extracts FormData from request
 */
export async function getFormData(request: Request): Promise<FormData> {
  try {
    return await request.formData();
  } catch (error) {
    throw new Error('Invalid form data');
  }
}

/**
 * Validates file from FormData
 */
export function validateFile(
  file: File | null,
  maxSize: number,
  allowedTypes: string[]
): void {
  if (!file) {
    throw new Error('No file provided');
  }

  if (file.size > maxSize) {
    throw new Error(`File size exceeds maximum of ${maxSize} bytes`);
  }

  if (!allowedTypes.includes(file.type)) {
    throw new Error(`File type ${file.type} not allowed`);
  }
}

// ============================================================================
// REQUEST PARSING
// ============================================================================

/**
 * Safely parses JSON from request body
 */
export async function parseRequestBody<T = any>(
  request: Request
): Promise<T> {
  try {
    return await request.json();
  } catch (error) {
    throw new Error('Invalid JSON in request body');
  }
}

/**
 * Gets query parameters from request
 */
export function getQueryParams(request: Request): URLSearchParams {
  const url = new URL(request.url);
  return url.searchParams;
}

// ============================================================================
// RATE LIMITING (Basic)
// ============================================================================

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Simple in-memory rate limiter
 * For production, use Redis or a dedicated service
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000 // 1 minute
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  // Clean up expired records periodically
  if (rateLimitStore.size > 10000) {
    Array.from(rateLimitStore.entries()).forEach(([key, value]) => {
      if (value.resetTime < now) {
        rateLimitStore.delete(key);
      }
    });
  }

  if (!record || record.resetTime < now) {
    // New window
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: maxRequests - record.count };
}

/**
 * Rate limit middleware
 */
export function withRateLimit(
  handler: (request: Request) => Promise<NextResponse>,
  options: { maxRequests?: number; windowMs?: number } = {}
) {
  return async (request: Request): Promise<NextResponse> => {
    // Use IP address as identifier (simplified)
    const identifier = request.headers.get('x-forwarded-for') || 'unknown';

    const { allowed, remaining } = checkRateLimit(
      identifier,
      options.maxRequests,
      options.windowMs
    );

    if (!allowed) {
      return errorResponse('Rate limit exceeded. Please try again later.', 429);
    }

    const response = await handler(request);

    // Add rate limit headers
    response.headers.set('X-RateLimit-Remaining', String(remaining));

    return response;
  };
}

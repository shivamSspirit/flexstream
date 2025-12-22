/**
 * API Response Formatters
 * Standardized response format across all endpoints
 * DRY principle - consistent API responses
 */

import { NextResponse } from 'next/server';
import { AppError } from '@/lib/errors/AppError';

export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  meta?: {
    timestamp: string;
    [key: string]: any;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  meta?: {
    timestamp: string;
    [key: string]: any;
  };
}

/**
 * Create success response
 */
export function success<T>(data: T, meta?: Record<string, any>): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  });
}

/**
 * Create error response from AppError
 */
export function error(err: AppError): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    },
    { status: err.statusCode }
  );
}

/**
 * Create generic error response
 */
export function errorResponse(
  message: string,
  statusCode: number = 500,
  details?: Record<string, any>
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message,
        details,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    },
    { status: statusCode }
  );
}

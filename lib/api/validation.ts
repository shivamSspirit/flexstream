/**
 * Validation Utilities
 * Reusable validation functions for API requests
 */

import { PublicKey } from '@solana/web3.js';
import { ValidationError } from '@/lib/errors/AppError';

/**
 * Validate Solana wallet address
 */
export function validateWalletAddress(address: string): void {
  try {
    new PublicKey(address);
  } catch {
    throw new ValidationError('Invalid Solana wallet address', { address });
  }
}

/**
 * Validate required fields
 */
export function validateRequired<T extends Record<string, any>>(
  data: T,
  fields: (keyof T)[]
): void {
  const missing = fields.filter(field => !data[field]);
  
  if (missing.length > 0) {
    throw new ValidationError('Missing required fields', {
      missing: missing.map(String),
    });
  }
}

/**
 * Validate string length
 */
export function validateLength(
  value: string,
  min: number,
  max: number,
  fieldName: string
): void {
  if (value.length < min || value.length > max) {
    throw new ValidationError(
      `${fieldName} must be between ${min} and ${max} characters`,
      { length: value.length, min, max }
    );
  }
}

/**
 * Validate username format
 */
export function validateUsername(username: string): void {
  if (!/^[a-z0-9]+$/.test(username)) {
    throw new ValidationError(
      'Username must contain only lowercase letters and numbers',
      { username }
    );
  }
  
  validateLength(username, 3, 20, 'Username');
}

/**
 * Validate ticker symbol
 */
export function validateTicker(ticker: string): void {
  if (!/^[A-Z0-9]+$/.test(ticker)) {
    throw new ValidationError(
      'Ticker must contain only uppercase letters and numbers',
      { ticker }
    );
  }
  
  validateLength(ticker, 3, 10, 'Ticker');
}

/**
 * Parse and validate pagination parameters
 */
export function parsePagination(searchParams: URLSearchParams): {
  limit: number;
  offset: number;
} {
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
  const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);
  
  return { limit, offset };
}

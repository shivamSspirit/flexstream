/**
 * Database Client Factory
 * Single source of truth for Supabase client creation
 * Follows DRY principle - no more repeated client creation
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DatabaseError } from '@/lib/errors/AppError';

let serviceClient: SupabaseClient | null = null;
let anonClient: SupabaseClient | null = null;

/**
 * Get service role client (backend only, full access)
 * Use this in API routes for admin operations
 */
export function getServiceClient(): SupabaseClient {
  if (serviceClient) return serviceClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new DatabaseError('Supabase credentials not configured');
  }

  serviceClient = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return serviceClient;
}

/**
 * Get anon client (frontend safe, RLS applies)
 * Use this in client components
 */
export function getAnonClient(): SupabaseClient {
  if (anonClient) return anonClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !supabaseKey) {
    throw new DatabaseError('Supabase public credentials not configured');
  }

  anonClient = createClient(supabaseUrl, supabaseKey);

  return anonClient;
}

// Default export is service client for API routes
export const db = getServiceClient();

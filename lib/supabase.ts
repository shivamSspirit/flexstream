import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// ═══════════════════════════════════════════════════════════════════════════
// SUPABASE CLIENT CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC CLIENT (for client-side operations with RLS)
// ─────────────────────────────────────────────────────────────────────────────
export const supabase: SupabaseClient<Database> | null =
  supabaseUrl && supabaseAnonKey
    ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true
        }
      })
    : null;

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN CLIENT (for server-side operations bypassing RLS)
// Only use in API routes, never expose to client
// ─────────────────────────────────────────────────────────────────────────────
export const supabaseAdmin: SupabaseClient<Database> | null =
  supabaseUrl && supabaseServiceKey
    ? createClient<Database>(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })
    : null;

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Get admin client or throw
// ─────────────────────────────────────────────────────────────────────────────
export function getSupabaseAdmin(): SupabaseClient<Database> {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not initialized. Check SUPABASE_SERVICE_ROLE_KEY.');
  }
  return supabaseAdmin;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Get public client or throw
// ─────────────────────────────────────────────────────────────────────────────
export function getSupabase(): SupabaseClient<Database> {
  if (!supabase) {
    throw new Error('Supabase client not initialized. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }
  return supabase;
}

// ─────────────────────────────────────────────────────────────────────────────
// STORAGE BUCKET NAME (matches Supabase configuration)
// ─────────────────────────────────────────────────────────────────────────────
export const STORAGE_BUCKET = 'flexstream';

// ─────────────────────────────────────────────────────────────────────────────
// TYPE EXPORTS (re-export from database.types for convenience)
// ─────────────────────────────────────────────────────────────────────────────
export type { Database, Tables, TablesInsert, TablesUpdate, Views, Json } from './database.types';

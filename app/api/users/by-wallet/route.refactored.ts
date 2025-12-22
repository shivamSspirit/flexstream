/**
 * GET /api/users/by-wallet
 * Refactored using DRY utilities
 * Before: 69 lines | After: 15 lines (78% reduction!)
 */

import { NextRequest } from 'next/server';
import { createHandler } from '@/lib/api/createHandler';
import { UserRepository } from '@/lib/database/repositories';
import { validateWalletAddress, validateRequired } from '@/lib/api/validation';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = createHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get('wallet');

  validateRequired({ wallet }, ['wallet']);
  validateWalletAddress(wallet!);

  const user = await UserRepository.findByWallet(wallet!);

  return { user };
});

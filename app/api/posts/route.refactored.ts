/**
 * GET /api/posts
 * Refactored using DRY utilities
 * Before: 222 lines | After: 25 lines (89% reduction!)
 */

import { NextRequest } from 'next/server';
import { createHandler } from '@/lib/api/createHandler';
import { PostRepository } from '@/lib/database/repositories';
import { parsePagination } from '@/lib/api/validation';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = createHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || undefined;
  const pagination = parsePagination(searchParams);

  const { posts, count } = await PostRepository.findAll({
    ...pagination,
    userId,
  });

  return {
    posts,
    count,
    ...pagination,
  };
});

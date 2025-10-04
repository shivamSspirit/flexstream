import { NextRequest, NextResponse } from 'next/server';
// import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  console.log('🔍 [DEBUG AUTH] GET /api/debug-auth - Starting request');
  
  try {
    const userId = request.headers.get('x-user-id');
    console.log('🔐 [DEBUG AUTH] Auth check - userId:', userId);
    
    return NextResponse.json({
      success: true,
      userId: userId,
      authenticated: !!userId,
      timestamp: Date.now(),
    });

  } catch (error) {
    console.error('❌ [DEBUG AUTH] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now(),
    }, { status: 500 });
  }
}

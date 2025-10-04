import { NextRequest, NextResponse } from 'next/server';
// import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  console.log('🔍 [Debug] Database debug request received');
  
  try {
    // Get the authenticated user from header (no Clerk)
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    console.log('✅ [Debug] Authenticated user:', userId);

    // Try to fetch a sample user to check table structure
    const { data: sampleUser, error: sampleError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    console.log('📊 [Debug] Sample user query result:', { sampleUser, sampleError });

    // Check if user exists in database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_user_id', userId)
      .single();

    // Also try with old id field
    const { data: userDataOld, error: userErrorOld } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    return NextResponse.json({
      success: true,
      debug: {
        userId,
        sampleUserQuery: {
          data: sampleUser,
          error: sampleError
        },
        userWithClerkId: {
          data: userData,
          error: userError
        },
        userWithOldId: {
          data: userDataOld,
          error: userErrorOld
        }
      }
    });

  } catch (error) {
    console.error('❌ [Debug] Error in debug endpoint:', error);
    return NextResponse.json({
      success: false,
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

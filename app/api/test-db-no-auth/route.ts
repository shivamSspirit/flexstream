import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  console.log('🔍 [Test] No-auth database test');
  
  try {
    // Test 1: Check if Supabase connection works
    console.log('🔗 [Test] Testing Supabase connection...');
    
    // Try to fetch a sample user to check table structure
    const { data: sampleUser, error: sampleError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    console.log('📊 [Test] Sample user query result:', { sampleUser, sampleError });

    // Test 2: Check if we can insert a test record (then delete it)
    const testUserId = 'test-user-' + Date.now();
    const { data: insertData, error: insertError } = await supabase
      .from('users')
      .insert({
        clerk_user_id: testUserId,
        username: 'test-user',
        display_name: 'Test User',
        wallet_address: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select();

    console.log('📝 [Test] Insert test result:', { insertData, insertError });

    // Clean up test record
    if (insertData && insertData.length > 0) {
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('clerk_user_id', testUserId);
      
      console.log('🗑️ [Test] Cleanup result:', { deleteError });
    }

    return NextResponse.json({
      success: true,
      message: 'Database test completed',
      timestamp: new Date().toISOString(),
      tests: {
        connection: {
          success: !sampleError,
          error: sampleError?.message || null,
          sampleData: sampleUser
        },
        insert: {
          success: !insertError,
          error: insertError?.message || null,
          insertedData: insertData
        }
      }
    });

  } catch (error) {
    console.error('❌ [Test] Error in no-auth database test:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      step: 'error_handling',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

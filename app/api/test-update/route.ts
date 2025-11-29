import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  console.log('🧪 TEST ENDPOINT CALLED');

  try {
    const body = await request.json();
    console.log('🧪 Received body:', body);

    return NextResponse.json({
      success: true,
      message: 'Test endpoint working!',
      receivedData: body
    });
  } catch (error) {
    console.error('🧪 Test endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

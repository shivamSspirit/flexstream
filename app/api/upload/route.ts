import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

type UploadRequest = {
  file: File;
  metadata: {
    name: string;
    symbol: string;
    description: string;
    creator: string; // Wallet address
  };
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const metadata = JSON.parse(formData.get('metadata') as string) as UploadRequest['metadata'];

    if (!file || !metadata) {
      throw new Error('Missing required fields');
    }

    // 1. Upload file to storage
    const fileName = file.name || 'unknown';
    const fileExt = fileName.includes('.') ? fileName.split('.').pop() : 'bin';
    const uniqueFileName = `${uuidv4()}.${fileExt}`;
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from('token-media')
      .upload(uniqueFileName, fileBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) throw new Error('Failed to upload file');

    // 2. Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('token-media')
      .getPublicUrl(uniqueFileName);

    // 3. Return uploaded file public URL (token creation handled elsewhere)
    return NextResponse.json({
      success: true,
      publicUrl,
      metadata,
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    const status = 400;
    const message = (error as Error).message || 'Internal server error';
    
    return NextResponse.json(
      { 
        success: false,
        error: message,
        code: 'INTERNAL_ERROR',
      },
      { status }
    );
  }
}
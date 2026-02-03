import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Initialize Supabase with proper null checking
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

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
    if (!supabase) {
      return NextResponse.json({
        success: false,
        error: 'Supabase not configured'
      }, { status: 500 });
    }

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
      .from('flexstream')
      .upload(`tokens/${uniqueFileName}`, fileBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) throw new Error('Failed to upload file');

    // 2. Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('flexstream')
      .getPublicUrl(`tokens/${uniqueFileName}`);

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
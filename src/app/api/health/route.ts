import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';

// 배포 진단용: 비밀값은 노출하지 않고 설정 여부(true/false)만 알려 준다.
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    supabaseConfigured: isSupabaseConfigured,
    adminPasswordSet: Boolean(process.env.ADMIN_PASSWORD),
    env: process.env.NODE_ENV,
  });
}

import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';

// 배포 진단용: 비밀값은 절대 노출하지 않고, 설정 여부(true/false)와 변수 "이름"만 알려 준다.
export const dynamic = 'force-dynamic';

const REQUIRED = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'] as const;

export async function GET() {
  const present = (name: string) => Boolean((process.env[name] || '').trim());
  return NextResponse.json({
    supabaseConfigured: isSupabaseConfigured,
    adminPasswordSet: present('ADMIN_PASSWORD'),
    required: Object.fromEntries(REQUIRED.map((n) => [n, present(n)])),
    // 서버에서 보이는 SUPABASE/ADMIN 관련 변수 이름 (오타 확인용, 값 제외)
    seenNames: Object.keys(process.env).filter((k) => /supa|admin/i.test(k)).sort(),
    env: process.env.NODE_ENV,
    netlifyContext: process.env.CONTEXT || null, // production / deploy-preview 등
  });
}

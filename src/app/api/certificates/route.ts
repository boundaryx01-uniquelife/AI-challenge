import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// Helper function to mask student name for privacy
function maskName(name: string): string {
  if (!name) return '';
  const trimmed = name.trim();
  if (trimmed.length <= 1) return trimmed;
  if (trimmed.length === 2) {
    return `${trimmed[0]}*`;
  }
  return `${trimmed[0]}${'*'.repeat(trimmed.length - 2)}${trimmed[trimmed.length - 1]}`;
}

// GET /api/certificates - Fetch all certificates (Hybrid Mode)
export async function GET() {
  try {
    if (isSupabaseConfigured && supabase) {
      // Fetch from Supabase Cloud PostgreSQL
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Adapt column names from Snake Case (Supabase) to Camel Case (Next.js)
      const adapted = (data || []).map((item: any) => ({
        id: item.id,
        grade: item.grade,
        classNum: item.class_num, // 1 = student, 2 = parent
        studentName: maskName(item.student_name),
        imageUrl: item.image_url,
        createdAt: item.created_at,
      }));

      return NextResponse.json({ success: true, data: adapted });
    } else {
      // Local SQLite Mode fallback
      const certificates = await prisma.certificate.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      });

      const maskedCertificates = certificates.map((cert) => ({
        ...cert,
        studentName: maskName(cert.studentName),
      }));

      return NextResponse.json({ success: true, data: maskedCertificates });
    }
  } catch (error) {
    console.error('Failed to fetch certificates:', error);
    return NextResponse.json(
      { success: false, error: '인증서를 가져오는 데 실패했습니다.' },
      { status: 500 }
    );
  }
}

// POST /api/certificates - Upload a certificate (Hybrid Mode)
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    const gradeStr = formData.get('grade') as string;
    const roleStr = formData.get('classNum') as string; // 1 = Student, 2 = Parent
    const studentName = formData.get('studentName') as string;
    const file = formData.get('image') as File | null;

    // Validate request fields
    if (!gradeStr || !roleStr || !studentName || !file) {
      return NextResponse.json(
        { success: false, error: '학년, 이름, 그리고 인증서 사진을 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    const grade = parseInt(gradeStr, 10);
    const role = parseInt(roleStr, 10); // 1 = Student, 2 = Parent

    if (isNaN(grade) || grade < 1 || grade > 6 || (role !== 1 && role !== 2)) {
      return NextResponse.json(
        { success: false, error: '올바르지 않은 학년 또는 참여 구분 정보입니다.' },
        { status: 400 }
      );
    }

    // Process file data
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileExt = path.extname(file.name) || '.jpg';
    const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${fileExt}`;

    if (isSupabaseConfigured && supabase) {
      // Cloud Upload Mode: Send to Supabase Storage Bucket ('certificates')
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('certificates')
        .upload(uniqueFilename, buffer, {
          contentType: file.type || 'image/jpeg',
          upsert: true,
        });

      if (uploadError) {
        console.error('Supabase upload error:', uploadError);
        throw new Error('클라우드 저장소 파일 업로드에 실패했습니다.');
      }

      // Get public accessible URL
      const { data: urlData } = supabase.storage
        .from('certificates')
        .getPublicUrl(uniqueFilename);

      const imageUrl = urlData.publicUrl;

      // Insert record in Supabase DB ('certificates')
      const { data: dbData, error: dbError } = await supabase
        .from('certificates')
        .insert([
          {
            grade,
            class_num: role,
            student_name: studentName.trim(),
            image_url: imageUrl,
          },
        ])
        .select();

      if (dbError) {
        console.error('Supabase DB error:', dbError);
        throw new Error('클라우드 데이터베이스 기록 생성에 실패했습니다.');
      }

      const created = dbData[0];
      return NextResponse.json(
        {
          success: true,
          data: {
            id: created.id,
            grade: created.grade,
            classNum: created.class_num,
            studentName: maskName(created.student_name),
            imageUrl: created.image_url,
            createdAt: created.created_at,
          },
        },
        { status: 201 }
      );
    } else {
      // Local SQLite Mode Fallback
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      try {
        await mkdir(uploadDir, { recursive: true });
      } catch (err) {
        // Directory might already exist
      }

      const filePath = path.join(uploadDir, uniqueFilename);
      await writeFile(filePath, buffer);

      const imageUrl = `/uploads/${uniqueFilename}`;

      // Insert record locally via Prisma
      const newCertificate = await prisma.certificate.create({
        data: {
          grade,
          classNum: role,
          studentName: studentName.trim(),
          imageUrl,
        },
      });

      return NextResponse.json(
        {
          success: true,
          data: {
            ...newCertificate,
            studentName: maskName(newCertificate.studentName),
          },
        },
        { status: 201 }
      );
    }
  } catch (error: any) {
    console.error('Failed to create certificate:', error);
    return NextResponse.json(
      { success: false, error: error.message || '인증서 등록 중 에러가 발생했습니다.' },
      { status: 500 }
    );
  }
}

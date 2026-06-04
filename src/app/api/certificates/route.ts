import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { writeFile, mkdir, unlink } from 'fs/promises';
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
export async function GET(request: Request) {
  try {
    const adminPassword = process.env.ADMIN_PASSWORD || 'nsns550';
    const requestPassword = request.headers.get('x-admin-password');

    // If the x-admin-password header is sent, it MUST match the adminPassword
    if (requestPassword && requestPassword !== adminPassword) {
      return NextResponse.json(
        { success: false, error: '관리자 비밀번호가 일치하지 않습니다.' },
        { status: 401 }
      );
    }
    const isAdmin = requestPassword === adminPassword;

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
        studentName: isAdmin ? item.student_name : maskName(item.student_name),
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

      const adaptedCertificates = certificates.map((cert) => ({
        ...cert,
        studentName: isAdmin ? cert.studentName : maskName(cert.studentName),
      }));

      return NextResponse.json({ success: true, data: adaptedCertificates });
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

// DELETE /api/certificates - Delete a certificate (Admin Only)
export async function DELETE(request: Request) {
  try {
    // 1. Verify admin password
    const adminPassword = process.env.ADMIN_PASSWORD || 'nsns550';
    const requestPassword = request.headers.get('x-admin-password');

    if (!requestPassword || requestPassword !== adminPassword) {
      return NextResponse.json(
        { success: false, error: '관리자 비밀번호가 일치하지 않습니다.' },
        { status: 401 }
      );
    }

    // 2. Parse certificate ID
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: '삭제할 인증서 ID가 유효하지 않습니다.' },
        { status: 400 }
      );
    }

    let imageUrl = '';

    // 3. Find certificate to get image path/URL
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('certificates')
        .select('image_url')
        .eq('id', id)
        .single();

      if (error || !data) {
        console.error('Failed to find certificate in Supabase:', error);
        return NextResponse.json(
          { success: false, error: '존재하지 않는 인증서입니다.' },
          { status: 404 }
        );
      }
      imageUrl = data.image_url;
    } else {
      const cert = await prisma.certificate.findUnique({
        where: { id },
      });

      if (!cert) {
        return NextResponse.json(
          { success: false, error: '존재하지 않는 인증서입니다.' },
          { status: 404 }
        );
      }
      imageUrl = cert.imageUrl;
    }

    // 4. Delete file from storage
    if (imageUrl) {
      const filename = imageUrl.substring(imageUrl.lastIndexOf('/') + 1);

      if (isSupabaseConfigured && supabase) {
        // Delete from Supabase Storage
        const { error: storageError } = await supabase.storage
          .from('certificates')
          .remove([filename]);

        if (storageError) {
          console.error('Supabase storage delete warning:', storageError);
          // Don't fail the request, we should still clean up DB records
        }
      } else {
        // Delete from local file system
        const filePath = path.join(process.cwd(), 'public', 'uploads', filename);
        await unlink(filePath).catch((err) => {
          console.error('Local file delete warning:', err);
        });
      }
    }

    // 5. Delete record from database
    if (isSupabaseConfigured && supabase) {
      const { error: dbError } = await supabase
        .from('certificates')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;
    } else {
      await prisma.certificate.delete({
        where: { id },
      });
    }

    return NextResponse.json({ success: true, message: '인증서가 성공적으로 삭제되었습니다.' });
  } catch (error: any) {
    console.error('Failed to delete certificate:', error);
    return NextResponse.json(
      { success: false, error: error.message || '인증서 삭제 중 에러가 발생했습니다.' },
      { status: 500 }
    );
  }
}

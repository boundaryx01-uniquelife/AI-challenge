import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { seasonStartISO } from '@/lib/season';
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

// Supabase DB에 인증서 레코드 생성 (파일은 이미 스토리지에 올라가 있음)
async function insertSupabaseCertificate(grade: number, role: number, studentName: string, imageUrl: string) {
  if (!supabase) throw new Error('Supabase가 설정되지 않았습니다.');
  const { data: dbData, error: dbError } = await supabase
    .from('certificates')
    .insert([{ grade, class_num: role, student_name: studentName.trim(), image_url: imageUrl }])
    .select();

  if (dbError || !dbData || !dbData[0]) {
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
}

const NOT_CONFIGURED_MESSAGE =
  '서버 저장소(Supabase) 설정이 아직 연결되지 않았어요. 관리자에게 알려 주세요.';

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
      // 일반 사용자에게는 2기(시즌 시작 이후) 자료만 보여 준다. 관리자는 전체(1기 포함)를 본다.
      let query = supabase.from('certificates').select('*').order('created_at', { ascending: false });
      if (!isAdmin) query = query.gte('created_at', seasonStartISO());
      const { data, error } = await query;

      if (error) throw error;

      // Adapt column names from Snake Case (Supabase) to Camel Case (Next.js)
      const adapted = (data || []).map((item: any) => ({
        id: item.id,
        grade: item.grade,
        classNum: item.class_num, // 1 = student, 2 = parent
        studentName: isAdmin ? item.student_name : maskName(item.student_name),
        imageUrl: item.image_url,
        createdAt: item.created_at,
        isPreviousSeason: new Date(item.created_at) < new Date(seasonStartISO()),
      }));

      return NextResponse.json({ success: true, data: adapted });
    } else {
      // Local SQLite Mode fallback
      const certificates = await prisma.certificate.findMany({
        where: isAdmin ? undefined : { createdAt: { gte: new Date(seasonStartISO()) } },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const adaptedCertificates = certificates.map((cert) => ({
        ...cert,
        isPreviousSeason: cert.createdAt < new Date(seasonStartISO()),
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
    // --- JSON 모드: 파일은 브라우저가 Supabase 스토리지에 직접 올렸고, 여기서는 기록만 만든다 ---
    // (서버리스 함수의 요청 크기 제한(약 6MB)을 피하기 위함)
    if ((request.headers.get('content-type') || '').includes('application/json')) {
      if (!isSupabaseConfigured || !supabase) {
        return NextResponse.json({ success: false, error: NOT_CONFIGURED_MESSAGE }, { status: 503 });
      }
      const body = await request.json();
      const grade = Number(body.grade);
      const role = Number(body.classNum);
      const name = typeof body.studentName === 'string' ? body.studentName.trim() : '';
      const imageUrl = typeof body.imageUrl === 'string' ? body.imageUrl : '';

      if (!Number.isInteger(grade) || grade < 1 || grade > 6 || (role !== 1 && role !== 2) || name.length < 2 || name.length > 20) {
        return NextResponse.json({ success: false, error: '입력 정보가 올바르지 않습니다.' }, { status: 400 });
      }
      // 우리 Supabase 'certificates' 버킷의 공개 주소만 허용 (임의 URL 저장 방지)
      const allowedPrefix = `${(process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '')}/storage/v1/object/public/certificates/`;
      if (!imageUrl.startsWith(allowedPrefix)) {
        return NextResponse.json({ success: false, error: '올바르지 않은 파일 주소입니다.' }, { status: 400 });
      }
      return await insertSupabaseCertificate(grade, role, name, imageUrl);
    }

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

      return await insertSupabaseCertificate(grade, role, studentName, imageUrl);
    } else {
      // 운영(서버리스)에는 쓰기 가능한 디스크가 없으므로 로컬 저장은 개발 환경에서만 허용
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ success: false, error: NOT_CONFIGURED_MESSAGE }, { status: 503 });
      }
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

// PATCH /api/certificates?id=... - 게시 내용 수정 (관리자 전용): 이름 / 학년 / 학생·학부모 구분
export async function PATCH(request: Request) {
  try {
    const adminPassword = process.env.ADMIN_PASSWORD || 'nsns550';
    const requestPassword = request.headers.get('x-admin-password');
    if (!requestPassword || requestPassword !== adminPassword) {
      return NextResponse.json({ success: false, error: '관리자 비밀번호가 일치하지 않습니다.' }, { status: 401 });
    }

    const id = new URL(request.url).searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: '수정할 인증서 ID가 유효하지 않습니다.' }, { status: 400 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: '수정할 내용이 없습니다.' }, { status: 400 });
    }

    // 보낸 항목만 검증·반영한다. (올린 시각·이미지는 수정 대상이 아님)
    const changes: { studentName?: string; grade?: number; classNum?: number } = {};
    if (body.studentName !== undefined) {
      const name = typeof body.studentName === 'string' ? body.studentName.trim() : '';
      if (name.length < 1 || name.length > 20) {
        return NextResponse.json({ success: false, error: '이름은 1~20자로 입력해 주세요.' }, { status: 400 });
      }
      changes.studentName = name;
    }
    if (body.grade !== undefined) {
      const grade = Number(body.grade);
      if (!Number.isInteger(grade) || grade < 1 || grade > 6) {
        return NextResponse.json({ success: false, error: '학년은 1~6 사이여야 합니다.' }, { status: 400 });
      }
      changes.grade = grade;
    }
    if (body.classNum !== undefined) {
      const role = Number(body.classNum);
      if (role !== 1 && role !== 2) {
        return NextResponse.json({ success: false, error: '참여 구분은 학생(1) 또는 학부모(2)여야 합니다.' }, { status: 400 });
      }
      changes.classNum = role;
    }
    if (Object.keys(changes).length === 0) {
      return NextResponse.json({ success: false, error: '수정할 내용이 없습니다.' }, { status: 400 });
    }

    if (isSupabaseConfigured && supabase) {
      const row: Record<string, string | number> = {};
      if (changes.studentName !== undefined) row.student_name = changes.studentName;
      if (changes.grade !== undefined) row.grade = changes.grade;
      if (changes.classNum !== undefined) row.class_num = changes.classNum;

      const { data, error } = await supabase.from('certificates').update(row).eq('id', id).select();
      if (error) {
        console.error('Supabase update error:', error);
        throw new Error('클라우드 데이터베이스 수정에 실패했습니다. (Supabase의 수정 권한 정책을 확인해 주세요)');
      }
      if (!data || data.length === 0) {
        // 대상이 없거나, 수정(UPDATE) 정책이 없어 0건이 반영된 경우
        return NextResponse.json(
          { success: false, error: '수정된 항목이 없습니다. 존재하지 않는 인증서이거나 Supabase에 수정(UPDATE) 권한 정책이 없습니다.' },
          { status: 404 }
        );
      }
      const u = data[0];
      return NextResponse.json({
        success: true,
        data: { id: u.id, grade: u.grade, classNum: u.class_num, studentName: u.student_name, imageUrl: u.image_url, createdAt: u.created_at },
      });
    }

    const existing = await prisma.certificate.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: '존재하지 않는 인증서입니다.' }, { status: 404 });
    }
    const updated = await prisma.certificate.update({ where: { id }, data: changes });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Failed to update certificate:', error);
    return NextResponse.json(
      { success: false, error: (error instanceof Error && error.message) || '인증서 수정 중 에러가 발생했습니다.' },
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

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

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

export async function GET() {
  try {
    if (isSupabaseConfigured && supabase) {
      // Cloud Supabase Mode: Fetch all certificates and aggregate in memory
      const { data, error } = await supabase
        .from('certificates')
        .select('grade, class_num, student_name');

      if (error) throw error;

      // 1. Aggregate Grade Rankings
      const gradeCounts: Record<number, number> = {};
      (data || []).forEach((item: any) => {
        gradeCounts[item.grade] = (gradeCounts[item.grade] || 0) + 1;
      });
      const classRankings = Object.entries(gradeCounts)
        .map(([grade, count]) => ({
          grade: parseInt(grade, 10),
          classNum: 1, // kept for compatibility
          count,
        }))
        .sort((a, b) => b.count - a.count);

      // 2. Aggregate Student rankings (Top 10)
      const studentMap: Record<
        string,
        { grade: number; classNum: number; name: string; count: number }
      > = {};

      (data || []).forEach((item: any) => {
        const key = `${item.grade}_${item.class_num}_${item.student_name}`;
        if (!studentMap[key]) {
          studentMap[key] = {
            grade: item.grade,
            classNum: item.class_num,
            name: item.student_name,
            count: 0,
          };
        }
        studentMap[key].count += 1;
      });

      const studentRankings = Object.values(studentMap)
        .map((item) => {
          const isParent = item.classNum === 2;
          const displayName = isParent
            ? `${maskName(item.name)} (학부모)`
            : maskName(item.name);

          return {
            grade: item.grade,
            classNum: item.classNum,
            studentName: displayName,
            count: item.count,
          };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return NextResponse.json({
        success: true,
        data: {
          classRankings,
          studentRankings,
        },
      });
    } else {
      // Local SQLite Mode Fallback
      const rawGradeData = await prisma.certificate.groupBy({
        by: ['grade'],
        _count: {
          id: true,
        },
      });

      const classRankings = rawGradeData
        .map((item) => ({
          grade: item.grade,
          classNum: 1,
          count: item._count.id,
        }))
        .sort((a, b) => b.count - a.count);

      const rawStudentData = await prisma.certificate.groupBy({
        by: ['grade', 'classNum', 'studentName'],
        _count: {
          id: true,
        },
      });

      const studentRankings = rawStudentData
        .map((item) => {
          const isParent = item.classNum === 2;
          const displayName = isParent
            ? `${maskName(item.studentName)} (학부모)`
            : maskName(item.studentName);

          return {
            grade: item.grade,
            classNum: item.classNum,
            studentName: displayName,
            count: item._count.id,
          };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return NextResponse.json({
        success: true,
        data: {
          classRankings,
          studentRankings,
        },
      });
    }
  } catch (error) {
    console.error('Failed to fetch rankings:', error);
    return NextResponse.json(
      { success: false, error: '랭킹 데이터를 가져오는 데 실패했습니다.' },
      { status: 500 }
    );
  }
}

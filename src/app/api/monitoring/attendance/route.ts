import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// 🔹 Definisikan tipe data agar tidak perlu pakai `any`
interface AttendanceRecord {
  date: string;
  status: string;
}

interface Student {
  student_id: string;
  name: string;
  attendance_records: AttendanceRecord[];
}

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const { searchParams } = new URL(request.url);
  const classId = searchParams.get('class_id');
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');

  if (!classId || !startDate || !endDate) {
    return NextResponse.json(
      { message: 'Parameter class_id, start_date, dan end_date diperlukan.' },
      { status: 400 }
    );
  }

  try {
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select(`
        student_id: id,
        name,
        attendance_records ( date, status )
      `)
      .eq('class_id', classId)
      .eq('active', true)
      .gte('attendance_records.date', startDate)
      .lte('attendance_records.date', endDate)
      .order('name', { ascending: true });

    if (studentsError) {
      console.error('Supabase students fetch error:', studentsError);
      throw new Error('Gagal mengambil data monitoring siswa.');
    }

    const { data: distinctDates, error: distinctDatesError } = await supabase.rpc(
      'get_distinct_dates_for_class',
      {
        p_class_id: classId,
        p_start_date: startDate,
        p_end_date: endDate,
      }
    );

    if (distinctDatesError) {
      console.error('RPC distinct dates error:', distinctDatesError);
    }

    let activeDaysCount = 0;

    if (distinctDates && Array.isArray(distinctDates)) {
      activeDaysCount = distinctDates.length;
    } else if (students && Array.isArray(students)) {
      const allDates = new Set<string>();
      (students as Student[]).forEach((student) => {
        if (Array.isArray(student.attendance_records)) {
          student.attendance_records.forEach((record) => {
            allDates.add(record.date);
          });
        }
      });
      activeDaysCount = allDates.size;
    }

    return NextResponse.json({
      monitoringData: students ?? [],
      activeDaysCount,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Terjadi kesalahan pada server';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

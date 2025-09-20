import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Inisialisasi Supabase client dengan service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { class_id, date } = await req.json();

    // Validasi input
    if (!class_id || !date) {
      return NextResponse.json(
        { error: 'Parameter class_id dan date dibutuhkan.' },
        { status: 400 }
      );
    }

    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id')
      .eq('class_id', class_id);

    if (studentsError) {
      console.error('Supabase error getting students:', studentsError.message);
      throw new Error('Gagal mengambil data siswa dari kelas ini.');
    }

    if (!students || students.length === 0) {
      return NextResponse.json({ message: 'Tidak ada siswa di kelas ini untuk diliburkan.' });
    }

    // --- PERBAIKAN DI SINI ---
    // Nama kolom diubah dari 'checked_in_at' menjadi 'time' agar sesuai dengan database
    const attendanceDataToUpsert = students.map(student => ({
      student_id: student.id,
      class_id: class_id,
      date: date,
      status: 'Libur',
      time: null, // <-- NAMA KOLOM DIPERBAIKI
    }));

    const { error: upsertError } = await supabase
      .from('attendance_records')
      .upsert(attendanceDataToUpsert, {
        onConflict: 'student_id, class_id, date',
      });

    if (upsertError) {
      console.error('Supabase error upserting attendance:', upsertError.message);
      throw new Error('Gagal menyimpan status libur ke database.');
    }

    return NextResponse.json({ message: 'Seluruh siswa berhasil diliburkan.' });

  } catch (err: unknown) {
    const error = err as Error;
    console.error('API Error:', error.message);
    return NextResponse.json(
        { error: error.message || 'Terjadi kesalahan pada server.' }, 
        { status: 500 }
    );
  }
}


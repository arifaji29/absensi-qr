import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// ✅ Tambahkan baris ini agar route dianggap dinamis oleh Next.js
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  // ✅ Ambil cookieStore secara async agar tidak error
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  try {
    const { date, student_id, class_id, status } = await request.json();

    if (!date || !student_id || !class_id || !status) {
      return NextResponse.json(
        { message: 'Data yang dikirim tidak lengkap.' },
        { status: 400 }
      );
    }

    if (status === 'Belum Hadir') {
      // ❌ Hapus record absensi siswa untuk tanggal ini
      const { error } = await supabase
        .from('attendance_records')
        .delete()
        .match({ student_id, date });

      if (error) {
        console.error('Supabase delete error:', error.message);
        throw new Error('Gagal mereset status absensi.');
      }

      return NextResponse.json({ message: 'Status berhasil direset!' });
    } else {
      // ✅ Jika status bukan "Belum Hadir", lakukan upsert
      const recordToUpsert = {
        student_id,
        class_id,
        date,
        status,
        time: status === 'Hadir' ? new Date().toISOString() : null,
      };

      const { error } = await supabase
        .from('attendance_records')
        .upsert(recordToUpsert, { onConflict: 'student_id, date' });

      if (error) {
        console.error('Supabase single upsert error:', error.message);
        throw new Error('Gagal menyimpan data absensi.');
      }

      return NextResponse.json(
        { message: 'Absensi berhasil diperbarui!' },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error('API Single Update Error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Terjadi kesalahan internal server.';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const class_id = searchParams.get('class_id');
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    if (!class_id || !month || !year) {
      return NextResponse.json({ error: "Parameter class_id, month, dan year wajib diisi." }, { status: 400 });
    }

    const startDate = new Date(parseInt(year), parseInt(month), 1).toISOString();
    const endDate = new Date(parseInt(year), parseInt(month) + 1, 0).toISOString();

    // 1. Ambil semua siswa
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, name')
      .eq('class_id', class_id)
      .order('name', { ascending: true });
    if (studentsError) throw studentsError;

    // 2. Ambil semua catatan infaq di bulan ini
    const { data: infaqRecords, error: infaqError } = await supabase
      .from('infaq_records')
      .select('student_id, amount, date')
      .eq('class_id', class_id)
      .gte('date', startDate)
      .lte('date', endDate);
    if (infaqError) throw infaqError;

    // ==========================================================
    // === PERBAIKAN UTAMA: OLAH DATA UNTUK TAMPILAN HARIAN ===
    // ==========================================================
    const infaqByDay: { [studentId: string]: { [day: number]: number } } = {};
    const infaqSummary: { [studentId: string]: number } = {};

    for (const record of infaqRecords) {
      const day = new Date(record.date).getUTCDate(); // Ambil tanggal (1-31)
      
      // Inisialisasi jika belum ada
      if (!infaqByDay[record.student_id]) {
        infaqByDay[record.student_id] = {};
      }
      if (!infaqSummary[record.student_id]) {
        infaqSummary[record.student_id] = 0;
      }

      // Tambahkan data harian
      infaqByDay[record.student_id][day] = (infaqByDay[record.student_id][day] || 0) + record.amount;
      // Akumulasi data bulanan
      infaqSummary[record.student_id] = infaqSummary[record.student_id] + record.amount;
    }
    
    // Kirim kedua jenis data ke frontend
    return NextResponse.json({ students, infaqByDay, infaqSummary });

  } catch (err: unknown) {
    const error = err as Error;
    console.error("API GET Infaq Monitoring Error:", error.message);
    return NextResponse.json({ error: "Terjadi kesalahan pada server." }, { status: 500 });
  }
}
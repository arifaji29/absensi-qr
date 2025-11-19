import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const now = new Date();
    
    // Ambil parameter bulan & tahun
    const targetMonth = searchParams.get('month') ? parseInt(searchParams.get('month')!) : now.getMonth();
    const targetYear = searchParams.get('year') ? parseInt(searchParams.get('year')!) : now.getFullYear();

    const startDate = 1;
    // Jika target bulan ini, sampai kemarin. Jika bulan lalu, sampai akhir bulan.
    let endDate = new Date(targetYear, targetMonth + 1, 0).getDate();
    if (targetMonth === now.getMonth() && targetYear === now.getFullYear()) {
        endDate = now.getDate() - 1;
    }

    let totalUpdated = 0;
    const logs: string[] = [];

    console.log(`[Active Day Backfill] Memulai...`);

    // 1. Ambil Siswa Aktif
    const { data: allStudents, error: stErr } = await supabaseAdmin
      .from('students')
      .select('id, class_id')
      .not('class_id', 'is', null); 
    
    if (stErr || !allStudents) throw new Error("Gagal ambil siswa");

    // 2. Looping Tanggal
    for (let day = startDate; day <= endDate; day++) {
      // Set jam 12 siang (Aman Timezone)
      const currentObj = new Date(targetYear, targetMonth, day, 12, 0, 0);
      const dateString = currentObj.toISOString().split('T')[0]; 
      const timeString = currentObj.toISOString();

      // --- LOGIKA UTAMA DI SINI ---
      
      // Cek apakah ada data absensi APAPUN di tanggal ini
      const { data: existing, error: attErr } = await supabaseAdmin
        .from('attendance_records')
        .select('student_id')
        .eq('date', dateString);

      if (attErr) continue;

      // JIKA TIDAK ADA DATA SAMA SEKALI -> SKIP (Anggap Libur/Tidak Ada KBM)
      if (!existing || existing.length === 0) {
        // console.log(`  [SKIP] ${dateString}: Tidak ada aktifitas absensi.`);
        continue; 
      }

      // JIKA ADA DATA -> Berarti Hari Aktif. Cari siapa yang belum absen.
      const attendedIds = new Set(existing.map((a: any) => a.student_id));
      const absentStudents = allStudents.filter(s => !attendedIds.has(s.id));

      if (absentStudents.length > 0) {
        const insertData = absentStudents.map(s => ({
          student_id: s.id,
          class_id: s.class_id,
          date: dateString,
          status: "Alpha",
          time: timeString
        }));

        const { error: insErr } = await supabaseAdmin
          .from('attendance_records')
          .insert(insertData);

        if (!insErr) {
          totalUpdated += insertData.length;
          logs.push(`${dateString}: Menambahkan ${insertData.length} Alpha (Karena hari aktif).`);
          console.log(`  [OK] ${dateString}: Terdeteksi hari aktif. Mengisi ${insertData.length} Alpha.`);
        }
      } else {
          // console.log(`  [OK] ${dateString}: Hari aktif, tapi semua hadir lengkap.`);
      }
    }

    return NextResponse.json({
      success: true,
      mode: "active_days_only", // Info mode
      total_students_marked_alpha: totalUpdated,
      details: logs
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
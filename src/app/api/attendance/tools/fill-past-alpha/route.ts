import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type StudentRow = {
  id: string;
  class_id: string | null;
};

type AttendanceRow = {
  student_id: string;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const now = new Date();

    // Ambil parameter bulan & tahun
    const targetMonth = searchParams.get("month")
      ? parseInt(searchParams.get("month")!)
      : now.getMonth();
    const targetYear = searchParams.get("year")
      ? parseInt(searchParams.get("year")!)
      : now.getFullYear();

    const startDate = 1;

    // Tentukan endDate
    let endDate = new Date(targetYear, targetMonth + 1, 0).getDate();
    if (targetMonth === now.getMonth() && targetYear === now.getFullYear()) {
      endDate = now.getDate() - 1;
    }

    let totalUpdated = 0;
    const logs: string[] = [];

    console.log(`[Active Day Backfill] Memulai...`);

    // 1. Ambil Siswa Aktif
    const { data: allStudents, error: stErr } = await supabaseAdmin
      .from("students")
      .select("id, class_id")
      .not("class_id", "is", null);

    if (stErr || !allStudents) throw new Error("Gagal ambil siswa");

    // 2. Looping Tanggal
    for (let day = startDate; day <= endDate; day++) {
      const currentObj = new Date(targetYear, targetMonth, day, 12, 0, 0);
      const dateString = currentObj.toISOString().split("T")[0];
      const timeString = currentObj.toISOString();

      // Ambil absensi tanggal tersebut
      const { data: existing, error: attErr } = await supabaseAdmin
        .from("attendance_records")
        .select("student_id")
        .eq("date", dateString);

      if (attErr) continue;

      // Jika tidak ada absensi sama sekali → Hari libur → SKIP
      if (!existing || existing.length === 0) {
        continue;
      }

      // Jika ada aktivitas → hari aktif → cek siapa yang belum absen
      const attendedIds = new Set(
        existing.map((a: AttendanceRow) => a.student_id)
      );

      const absentStudents = allStudents.filter(
        (s: StudentRow) => !attendedIds.has(s.id)
      );

      if (absentStudents.length > 0) {
        const insertData = absentStudents.map((s: StudentRow) => ({
          student_id: s.id,
          class_id: s.class_id,
          date: dateString,
          status: "Alpha",
         time: null,
        }));

        const { error: insErr } = await supabaseAdmin
          .from("attendance_records")
          .insert(insertData);

        if (!insErr) {
          totalUpdated += insertData.length;
          logs.push(
            `${dateString}: Menambahkan ${insertData.length} Alpha (Karena hari aktif).`
          );

          console.log(
            `  [OK] ${dateString}: Hari aktif. Mengisi ${insertData.length} Alpha.`
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      mode: "active_days_only",
      total_students_marked_alpha: totalUpdated,
      details: logs,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// app/api/monitoring/attendance/route.ts

import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

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
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const { searchParams } = new URL(request.url);
  const classId = searchParams.get("class_id");
  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");

  if (!classId || !startDate || !endDate) {
    return NextResponse.json(
      { message: "Parameter class_id, start_date, dan end_date diperlukan." },
      { status: 400 }
    );
  }

  try {
    // 1. Ambil data siswa (Monitoring Data) - INI TETAP PER KELAS, sudah benar
    const { data: students, error: studentsError } = await supabase
      .from("students")
      .select(`
        student_id: id,
        name,
        attendance_records ( date, status )
      `)
      .eq("class_id", classId)
      .eq("active", true)
      .gte("attendance_records.date", startDate)
      .lte("attendance_records.date", endDate)
      .order("name", { ascending: true });

    if (studentsError) {
      console.error("Supabase students fetch error:", studentsError);
      throw new Error("Gagal mengambil data monitoring siswa.");
    }

    // --- PERUBAHAN DI SINI ---
    // 2. Ambil hitungan hari aktif (Active Days Count) - INI SEKARANG GLOBAL
    const { data: distinctDates, error: distinctDatesError } = await supabase.rpc(
      "get_all_active_dates", // <-- NAMA FUNGSI BARU (dari Canvas)
      {
        // p_class_id: classId, // <-- PARAMETER INI DIHAPUS
        p_start_date: startDate,
        p_end_date: endDate,
      }
    );
    // --- AKHIR PERUBAHAN ---

    if (distinctDatesError) {
      console.error("RPC distinct dates error:", distinctDatesError);
      // Sebaiknya lempar error agar ditangkap oleh catch block
      throw new Error("Gagal mengambil data rekap tanggal aktif.");
    }

    // Hitung jumlah hari aktif hanya berdasarkan RPC yang baru
    // Logika fallback lama (berdasarkan `students`) dihapus karena itu per-kelas,
    // sedangkan kita ingin data global yang konsisten.
    const activeDaysCount = (distinctDates && Array.isArray(distinctDates)) 
      ? distinctDates.length 
      : 0;

    return NextResponse.json({
      monitoringData: students ?? [],
      activeDaysCount, // Ini sekarang adalah hitungan global
    });

  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Terjadi kesalahan pada server";
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

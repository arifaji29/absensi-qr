// app/api/attendance/parallel-bulk-update/route.ts

import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// Opsional: pastikan route ini selalu dinamis
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    // ✅ Perbaikan utama: cookies() harus di-await
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // 1. Ambil data dari body request
    const { date, attendanceData } = await request.json();

    // 2. Validasi input
    if (!date || !Array.isArray(attendanceData) || attendanceData.length === 0) {
      return NextResponse.json(
        { message: "Data yang dikirim tidak valid." },
        { status: 400 }
      );
    }

    // 3. Siapkan data untuk diinsert
    const recordsToInsert = attendanceData.map((item) => ({
      student_id: item.student_id,
      class_id: item.class_id,
      date,
      status: "Hadir",
      time: new Date().toISOString(), // <--- Diubah menjadi 'time'
    }));

    // 4. Lakukan upsert (insert or update)
    const { error } = await supabase
      .from("attendance_records")
      .upsert(recordsToInsert, {
        onConflict: "student_id,date",
      });

    if (error) {
      console.error("Supabase upsert error:", error.message);
      throw new Error("Gagal menyimpan data absensi ke database.");
    }

    // 5. Sukses
    return NextResponse.json(
      { message: "Absensi paralel berhasil disimpan!" },
      { status: 201 }
    );
  } catch (error) {
    console.error("API Error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan internal server.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

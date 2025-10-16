// app/api/students/all/route.ts

import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// Pastikan route selalu mengambil data terbaru
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // ✅ Jangan gunakan await di sini
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Ambil parameter tanggal dari URL
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json(
        { message: "Parameter tanggal diperlukan." },
        { status: 400 }
      );
    }

    // Ambil daftar ID siswa yang sudah diabsen pada tanggal tersebut
    const { data: attendedStudentIds, error: attendanceError } = await supabase
      .from("attendance_records")
      .select("student_id")
      .eq("date", date);

    if (attendanceError) {
      console.error("Supabase attendance error:", attendanceError.message);
      throw new Error("Gagal memeriksa data absensi.");
    }

    const attendedIds = (attendedStudentIds ?? []).map(
      (record: { student_id: string }) => record.student_id
    );

    // Ambil semua siswa aktif, kecuali yang sudah diabsen
    let query = supabase
      .from("students")
      .select("student_id:id, name, class_id")
      .eq("active", true);

    if (attendedIds.length > 0) {
      query = query.not("id", "in", `(${attendedIds.join(",")})`);
    }

    const { data: students, error: studentsError } = await query;

    if (studentsError) {
      console.error("Supabase students error:", studentsError.message);
      throw new Error("Gagal mengambil data siswa.");
    }

    // ✅ Berhasil: kirim data siswa dalam format JSON
    return NextResponse.json(students);
  } catch (error) {
    console.error("API Error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan internal server.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

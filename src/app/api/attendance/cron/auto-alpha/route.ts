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
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const now = new Date();
    const indonesiaTime = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
    );
    const dateString = indonesiaTime.toISOString().split("T")[0];
    const timeString = indonesiaTime.toISOString();

    // 1. Ambil siswa yang punya class_id
    const { data: allStudents, error: studentError } = await supabaseAdmin
      .from("students")
      .select("id, class_id")
      .not("class_id", "is", null);

    if (studentError) throw new Error(`Gagal ambil siswa: ${studentError.message}`);

    if (!allStudents || allStudents.length === 0) {
      return NextResponse.json({
        message: "Tidak ada siswa yang memiliki kelas (class_id).",
      });
    }

    // 2. Ambil absensi hari ini
    const { data: existingAttendance, error: attendanceError } =
      await supabaseAdmin
        .from("attendance_records")
        .select("student_id")
        .eq("date", dateString);

    if (attendanceError)
      throw new Error(`Gagal ambil absensi: ${attendanceError.message}`);

    const attendedStudentIds = new Set(
      existingAttendance?.map((a: AttendanceRow) => a.student_id)
    );

    // 3. Filter siswa yang belum absen
    const absentStudents = allStudents.filter(
      (student: StudentRow) => !attendedStudentIds.has(student.id)
    );

    if (absentStudents.length === 0) {
      return NextResponse.json({
        message: "Semua siswa (yang punya kelas) sudah diabsen hari ini.",
      });
    }

    // 4. Data Alpha
    const alphaData = absentStudents.map((student) => ({
      student_id: student.id,
      class_id: student.class_id!,
      date: dateString,
      status: "Alpha",
      time: null,
    }));

    // 5. Insert
    const { error: insertError } = await supabaseAdmin
      .from("attendance_records")
      .insert(alphaData);

    if (insertError)
      throw new Error(`Gagal insert Alpha: ${insertError.message}`);

    return NextResponse.json({
      success: true,
      message: `Berhasil menandai ${alphaData.length} siswa sebagai Alpha`,
      processed_date: dateString,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Cron Job Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

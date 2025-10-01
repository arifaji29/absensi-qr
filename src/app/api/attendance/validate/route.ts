import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST: Mengunci (memvalidasi) data absensi
export async function POST(req: NextRequest) {
  try {
    // PERBAIKAN: Membaca 'class_id' (snake_case) sesuai kiriman dari frontend
    const { class_id, date } = await req.json();

    if (!class_id || !date) {
      return NextResponse.json({ error: "Data tidak lengkap." }, { status: 400 });
    }

    const { error } = await supabase
      .from("daily_attendance_validation")
      .upsert({
        class_id: class_id, // Gunakan variabel yang sudah benar
        date: date,
        is_validated: true
      }, { onConflict: 'class_id, date' });

    if (error) {
        console.error("Supabase POST Attendance Validation Error:", error);
        throw new Error("Gagal menyimpan status validasi.");
    }

    return NextResponse.json({ message: "Data absensi berhasil disimpan dan dikunci!" });

  } catch (err: unknown) {
    const error = err as Error;
    console.error("API POST Attendance Validation Error:", error.message);
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}
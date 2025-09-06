import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper untuk mendapatkan tanggal hari ini dalam format YYYY-MM-DD zona WIB
const getTodayString = () => {
  const today = new Date();
  const offset = 7 * 60 * 60 * 1000; // Offset WIB (UTC+7)
  const wibDate = new Date(today.getTime() + offset);
  return wibDate.toISOString().split("T")[0];
};

export async function PATCH(req: Request) {
  try {
    const { class_id, status, student_id, date } = await req.json();

    if (!class_id || !status || !student_id || !date) {
      return NextResponse.json(
        { message: "Parameter class_id, status, student_id, dan date diperlukan" },
        { status: 400 }
      );
    }

    if (status === "Belum Hadir") {
      const { error: deleteError } = await supabase
        .from("attendance_records")
        .delete()
        .match({ student_id: student_id, date: date }); // Gunakan tanggal yang dikirim

      if (deleteError) throw deleteError;
      return NextResponse.json({ message: "Status kehadiran berhasil direset" });
    
    } else {
      // --- LOGIKA BARU UNTUK WAKTU KEHADIRAN ---
      let checkinTime = null;
      if (status === 'Hadir') {
        const todayString = getTodayString();
        if (date === todayString) {
          // Jika tanggal yang dipilih adalah hari ini, gunakan waktu sekarang
          checkinTime = new Date().toISOString();
        } else {
          // Jika tanggal yang dipilih adalah masa lalu, set waktu ke 07:00 WIB
          // 00:00:00 UTC sama dengan 07:00:00 WIB
          checkinTime = new Date(`${date}T00:00:00.000Z`).toISOString();
        }
      }
      // --- AKHIR LOGIKA BARU ---

      const { error: upsertError } = await supabase
        .from("attendance_records")
        .upsert(
          {
            student_id: student_id,
            class_id: class_id,
            date: date,
            status: status,
            time: checkinTime,
          },
          { onConflict: "student_id, date" }
        );

      if (upsertError) throw upsertError;
      return NextResponse.json({ message: "Status kehadiran berhasil diperbarui" });
    }

  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}


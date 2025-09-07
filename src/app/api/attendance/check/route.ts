import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const getTodayString = () => {
  const today = new Date();
  const offset = 7 * 60 * 60 * 1000;
  const wibDate = new Date(today.getTime() + offset);
  return wibDate.toISOString().split("T")[0];
};

export async function PATCH(req: Request) {
  try {
    const { class_id, status, student_id, date } = await req.json();
    if (!class_id || !status || !student_id || !date) {
      return NextResponse.json({ message: "Parameter tidak lengkap" }, { status: 400 });
    }
    if (status === "Belum Hadir") {
      const { error: deleteError } = await supabase.from("attendance_records").delete().match({ student_id: student_id, date: date });
      if (deleteError) throw deleteError;
      return NextResponse.json({ message: "Status kehadiran berhasil direset" });
    } else {
      let checkinTime = null;
      if (status === 'Hadir') {
        const todayString = getTodayString();
        checkinTime = date === todayString ? new Date().toISOString() : new Date(`${date}T00:00:00.000Z`).toISOString();
      }
      const { error: upsertError } = await supabase.from("attendance_records").upsert({ student_id, class_id, date, status, time: checkinTime }, { onConflict: "student_id, date" });
      if (upsertError) throw upsertError;
      return NextResponse.json({ message: "Status kehadiran berhasil diperbarui" });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan pada server";
    return NextResponse.json({ message }, { status: 500 });
  }
}


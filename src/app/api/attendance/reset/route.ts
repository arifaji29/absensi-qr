import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// DELETE: Menghapus semua record absensi untuk kelas dan tanggal tertentu
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const class_id = searchParams.get("class_id");
    const date = searchParams.get("date");

    if (!class_id || !date) {
      return NextResponse.json(
        { message: "Parameter class_id dan date diperlukan" },
        { status: 400 }
      );
    }

    // Hapus semua baris yang cocok
    const { error } = await supabase
      .from("attendance_records")
      .delete()
      .match({ class_id: class_id, date: date });

    if (error) throw error;

    return NextResponse.json({ message: "Absensi berhasil direset." });

  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Gagal mereset absensi" },
      { status: 500 }
    );
  }
}

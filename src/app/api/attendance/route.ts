// api/attendance/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Definisikan tipe data yang akan dikembalikan oleh RPC
type AttendanceRpcResponse = {
  student_id: string;
  nis: string;
  name: string;
  status: string;
  time_in: string | null; // Bisa jadi null jika siswa belum absen
  attendance_id: number | null;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const class_id = searchParams.get("class_id");
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

    if (!class_id) {
      return NextResponse.json({ error: "class_id wajib diisi" }, { status: 400 });
    }

    const { data, error } = await supabase.rpc('get_class_attendance', {
      p_class_id: class_id,
      p_date: date
    });

    if (error) throw error;

    // Format data agar sesuai dengan struktur frontend Anda
    const formattedData = data.map((item: AttendanceRpcResponse) => ({ // <-- TAMBAHKAN TIPE DI SINI
      id: item.student_id,
      student_id: item.student_id,
      nis: item.nis,
      name: item.name,
      status: item.status,
      checked_in_at: item.time_in,
    }));

    return NextResponse.json(formattedData);

  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
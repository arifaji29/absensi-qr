import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// --- PERBAIKAN DI SINI ---
// Tambahkan URL dan KEY saat membuat koneksi
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params; // ID kelas

    if (!id) {
      return NextResponse.json({ message: "ID Kelas diperlukan" }, { status: 400 });
    }

    // Ambil data dari tabel penghubung 'class_teachers'
    const { data, error } = await supabase
      .from("class_teachers")
      .select(`
        teachers ( id, name )
      `)
      .eq("class_id", id);
      
    if (error) {
      console.error("Supabase error fetching teachers for class:", error);
      throw error;
    }

    // Format ulang data agar menjadi array pengajar yang bersih
    const teachers = data.map((item: any) => item.teachers).filter(Boolean); // filter(Boolean) untuk menghapus null/undefined

    return NextResponse.json(teachers);

  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
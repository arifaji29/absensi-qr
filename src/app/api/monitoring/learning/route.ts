import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Inisialisasi Supabase client dengan service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Tipe untuk memformat data yang akan dikirim ke client
type FormattedJournal = {
  id: string;
  materi: string;
  deskripsi: string;
  catatan: string | null;
  date: string;
  class_name: string;
  teacher_name: string;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const class_id = searchParams.get("class_id");
    const start_date = searchParams.get("start_date"); // <-- Parameter baru
    const end_date = searchParams.get("end_date");     // <-- Parameter baru

    if (!class_id || !start_date || !end_date) {
      return NextResponse.json({ error: "Parameter class_id, start_date, dan end_date wajib diisi." }, { status: 400 });
    }

    // === PERUBAHAN UTAMA: Query untuk rentang tanggal ===
    const { data, error } = await supabase
      .from('journals')
      .select(`
        id,
        materi,
        deskripsi,
        catatan,
        date,
        class:classes ( name ),
        teacher:teachers ( name )
      `)
      .eq('class_id', class_id)
      .gte('date', start_date) // Lebih besar atau sama dengan tanggal mulai
      .lte('date', end_date)   // Lebih kecil atau sama dengan tanggal akhir
      .order('date', { ascending: false }); // Urutkan dari yang terbaru

    if (error) {
      console.error("Supabase error:", error.message);
      throw new Error("Gagal mengambil data jurnal dari database.");
    }
    
    if (!data) {
      return NextResponse.json([]); // Kembalikan array kosong jika tidak ada data
    }

    // Format data agar lebih mudah digunakan di frontend
    const formattedData: FormattedJournal[] = data.map((item: any) => ({
      id: item.id,
      materi: item.materi,
      deskripsi: item.deskripsi,
      catatan: item.catatan,
      date: item.date,
      class_name: item.class?.name || "N/A",
      teacher_name: item.teacher?.name || "N/A",
    }));

    return NextResponse.json(formattedData);

  } catch (err: unknown) {
    const error = err as Error;
    console.error("API Error:", error.message);
    return NextResponse.json(
        { error: error.message || 'Terjadi kesalahan pada server.' }, 
        { status: 500 }
    );
  }
}


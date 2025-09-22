import { NextResponse, NextRequest } from "next/server"; // PERUBAHAN 1: Impor NextRequest
import { createClient } from "@supabase/supabase-js";

// Inisialisasi Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Tipe data (tidak ada perubahan)
type FormattedJournal = {
  id: string;
  materi: string;
  deskripsi: string;
  catatan: string | null;
  date: string;
  class_name: string;
  teacher_name: string;
};

type RawJournalData = {
    id: string;
    materi: string;
    deskripsi: string;
    catatan: string | null;
    date: string;
    class: { name: string } | null;
    teacher: { name: string } | null;
};

// PERUBAHAN 2: Ganti tipe 'req' menjadi NextRequest
export async function GET(req: NextRequest) {
  try {
    // PERUBAHAN 3: Gunakan cara Next.js untuk membaca parameter URL
    const searchParams = req.nextUrl.searchParams;
    const class_id = searchParams.get("class_id");
    const start_date = searchParams.get("start_date");
    const end_date = searchParams.get("end_date");

    if (!class_id || !start_date || !end_date) {
      return NextResponse.json({ error: "Parameter class_id, start_date, dan end_date wajib diisi." }, { status: 400 });
    }

    // Query ke Supabase (tidak ada perubahan, sudah benar)
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
      .gte('date', start_date)
      .lte('date', end_date)
      .order('date', { ascending: false });

    if (error) {
      console.error("Supabase error:", error.message);
      throw new Error("Gagal mengambil data jurnal dari database.");
    }
    
    if (!data) {
      return NextResponse.json([]);
    }

    // Transformasi data (tidak ada perubahan, sudah benar)
    const formattedData: FormattedJournal[] = data.map((item: RawJournalData) => ({
      id: item.id,
      materi: item.materi,
      deskripsi: item.deskripsi,
      catatan: item.catatan,
      date: item.date,
      class_name: item.class?.name || "Kelas Tidak Ditemukan",
      teacher_name: item.teacher?.name || "Pengajar Tidak Ditemukan",
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
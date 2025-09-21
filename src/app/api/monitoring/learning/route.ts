import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Inisialisasi Supabase client dengan service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Tipe untuk memformat data yang akan dikirim ke client (tetap sama)
type FormattedJournal = {
  id: string;
  materi: string;
  deskripsi: string;
  catatan: string | null;
  date: string;
  class_name: string;
  teacher_name: string;
};

// === PERBAIKAN 1: Sesuaikan tipe agar cocok dengan hasil join Supabase ===
// Tipe ini sekarang mendefinisikan 'class' dan 'teacher' sebagai array dari objek.
type RawJournalData = {
    id: string;
    materi: string;
    deskripsi: string;
    catatan: string | null;
    date: string;
    class: { name: string }[] | null;
    teacher: { name: string }[] | null;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const class_id = searchParams.get("class_id");
    const start_date = searchParams.get("start_date");
    const end_date = searchParams.get("end_date");

    if (!class_id || !start_date || !end_date) {
      return NextResponse.json({ error: "Parameter class_id, start_date, dan end_date wajib diisi." }, { status: 400 });
    }

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

    // === PERBAIKAN 2: Ambil elemen pertama dari array saat mapping ===
    // Tipe 'item' sekarang sudah benar sesuai dengan RawJournalData.
    const formattedData: FormattedJournal[] = data.map((item: RawJournalData) => ({
      id: item.id,
      materi: item.materi,
      deskripsi: item.deskripsi,
      catatan: item.catatan,
      date: item.date,
      // Gunakan optional chaining (?.[0]) untuk mengambil elemen pertama dengan aman
      class_name: item.class?.[0]?.name || "N/A",
      teacher_name: item.teacher?.[0]?.name || "N/A",
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


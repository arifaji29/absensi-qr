import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Inisialisasi Supabase client dengan service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Handler untuk GET request (mengambil data jurnal)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const class_id = searchParams.get("class_id");
    const date = searchParams.get("date");

    if (!class_id || !date) {
      return NextResponse.json({ error: "Parameter class_id dan date dibutuhkan." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('journals')
      .select('*')
      .eq('class_id', class_id)
      .eq('date', date)
      .single(); // Ambil satu data saja

    if (error && error.code !== 'PGRST116') { // Abaikan error jika data tidak ditemukan
      console.error('Supabase GET error:', error);
      throw new Error("Gagal mengambil data jurnal dari database.");
    }
    
    return NextResponse.json(data);

  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Handler untuk POST request (menyimpan atau update jurnal)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, class_id, date, teacher_id, materi, deskripsi, catatan } = body;

    // Validasi input
    if (!class_id || !date || !teacher_id || !materi) {
      return NextResponse.json({ error: 'Field class_id, date, teacher_id, dan materi wajib diisi.' }, { status: 400 });
    }

    // Siapkan data untuk di-upsert
    const journalData = {
      id: id, // Jika id ada, akan diupdate. Jika tidak, akan dibuat.
      class_id,
      date,
      teacher_id,
      materi,
      deskripsi,
      catatan,
    };

    // Gunakan upsert untuk membuat atau memperbarui data
    const { data, error } = await supabase
      .from('journals')
      .upsert(journalData, { onConflict: 'id' }) // Update jika id sudah ada
      .select()
      .single();

    if (error) {
      console.error('Supabase POST error:', error);
      throw new Error("Gagal menyimpan data jurnal ke database.");
    }
    
    return NextResponse.json({ message: 'Jurnal berhasil disimpan', data });

  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

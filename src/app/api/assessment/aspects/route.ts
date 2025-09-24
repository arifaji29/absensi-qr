import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Inisialisasi Supabase client (gunakan service role key untuk operasi server)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Handler untuk POST request (membuat aspek penilaian baru)
export async function POST(req: NextRequest) {
  try {
    // 1. Membaca data dari body request
    const { name, scale_type, class_id, date } = await req.json();

    // 2. Validasi data di sisi server
    if (!name || !scale_type || !class_id || !date) {
      return NextResponse.json(
        { error: "Semua field (name, scale_type, class_id, date) wajib diisi." },
        { status: 400 } // Bad Request
      );
    }

    // 3. Menyimpan data ke tabel 'assessment_aspects'
    const { data, error } = await supabase
      .from("assessment_aspects")
      .insert({
        name,
        scale_type,
        class_id,
        date,
      })
      .select() // Mengembalikan data yang baru saja dibuat
      .single(); // Karena kita hanya memasukkan satu baris

    // 4. Penanganan error dari Supabase
    if (error) {
      // Cek jika error karena data duplikat (violates unique constraint)
      if (error.code === '23505') {
        return NextResponse.json(
          { error: "Aspek penilaian dengan nama ini sudah ada untuk kelas dan tanggal yang sama." },
          { status: 409 } // Conflict
        );
      }
      // Untuk error database lainnya
      console.error("Supabase insert error:", error);
      throw new Error("Gagal menyimpan aspek penilaian ke database.");
    }

    // 5. Mengirim respons sukses
    return NextResponse.json(data, { status: 201 }); // 201 Created

  } catch (err: unknown) {
    const error = err as Error;
    console.error("API POST Error:", error.message);
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan pada server.' },
      { status: 500 } // Internal Server Error
    );
  }
}

// UPDATE: Handler untuk GET request ditambahkan di sini
export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const class_id = searchParams.get('class_id');
        const date = searchParams.get('date');

        if (!class_id || !date) {
            return NextResponse.json({ error: "Parameter class_id dan date wajib diisi." }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('assessment_aspects')
            .select('*')
            .eq('class_id', class_id)
            .eq('date', date)
            .order('created_at', { ascending: true });
        
        if (error) {
            console.error("Supabase GET error:", error);
            throw error;
        }
        
        return NextResponse.json(data);

    } catch (err: unknown) {
        const error = err as Error;
        console.error("API GET Error:", error.message);
        return NextResponse.json(
            { error: error.message || 'Terjadi kesalahan pada server.' }, 
            { status: 500 }
        );
    }
}
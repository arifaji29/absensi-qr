import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: Cek status validasi infaq untuk tanggal & kelas tertentu
export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const class_id = searchParams.get('class_id');
        const date = searchParams.get('date');

        if (!class_id || !date) {
            return NextResponse.json({ error: "Parameter class_id dan date wajib diisi." }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('daily_infaq_validation')
            .select('is_validated')
            .eq('class_id', class_id)
            .eq('date', date)
            .single();
        
        if (error && error.code !== 'PGRST116') throw error; // Abaikan error jika baris tidak ada

        return NextResponse.json({ isValidated: data?.is_validated || false });

    } catch (err: unknown) {
        // PERBAIKAN: Melengkapi blok catch
        const error = err as Error;
        console.error("API GET Infaq Validation Error:", error.message);
        return NextResponse.json({ error: "Gagal memeriksa status validasi." }, { status: 500 });
    }
}

// POST: Mengunci (memvalidasi) data infaq
export async function POST(req: NextRequest) {
  try {
    const { classId, date } = await req.json();

    if (!classId || !date) {
      return NextResponse.json({ error: "Data tidak lengkap." }, { status: 400 });
    }

    const { error } = await supabase
      .from("daily_infaq_validation")
      .upsert({
        class_id: classId,
        date: date,
        is_validated: true
      }, { onConflict: 'class_id, date' });

    if (error) {
        console.error("Supabase POST Infaq Validation Error:", error);
        throw new Error("Gagal menyimpan status validasi.");
    }

    return NextResponse.json({ message: "Data infaq berhasil divalidasi/dikunci!" });

  } catch (err: unknown) {
    // PERBAIKAN: Melengkapi blok catch
    const error = err as Error;
    console.error("API POST Infaq Validation Error:", error.message);
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}
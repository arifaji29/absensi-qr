import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Tipe untuk data yang diterima dari client
type InfaqPayload = {
  [studentId: string]: { amount: number; description?: string };
};

// Tipe untuk hasil object yang dikirim ke client
type InfaqObject = {
  [studentId: string]: { amount: number; description: string | null };
};

// GET: Mengambil data infaq yang sudah ada untuk tanggal & kelas tertentu
export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const class_id = searchParams.get('class_id');
        const date = searchParams.get('date');

        if (!class_id || !date) {
            return NextResponse.json({ error: "Parameter class_id dan date wajib diisi." }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('infaq_records')
            .select('student_id, amount, description')
            .eq('class_id', class_id)
            .eq('date', date);
        
        if (error) throw error;

        const infaqObject = data.reduce((acc: InfaqObject, record) => {
            acc[record.student_id] = {
                amount: record.amount,
                description: record.description
            };
            return acc;
        }, {} as InfaqObject);
        
        return NextResponse.json(infaqObject);

    } catch (err: unknown) {
        const error = err as Error;
        console.error("API GET Infaq Error:", error.message);
        return NextResponse.json({ error: "Terjadi kesalahan pada server saat mengambil data infaq." }, { status: 500 });
    }
}

// POST: Menyimpan (Upsert) DAN Menghapus data infaq
export async function POST(req: NextRequest) {
  try {
    const { classId, date, infaqData }: { classId: string, date: string, infaqData: InfaqPayload } = await req.json();

    if (!classId || !date || !infaqData) {
      return NextResponse.json({ error: "Data tidak lengkap." }, { status: 400 });
    }

    // ==========================================================
    // === PERBAIKAN UTAMA: MEMISAHKAN DATA UNTUK DISIMPAN & DIHAPUS ===
    // ==========================================================

    // 1. Data untuk disimpan/diperbarui (amount > 0)
    const recordsToUpsert = Object.entries(infaqData)
      .filter(([, data]) => (data as { amount: number }).amount > 0)
      .map(([studentId, data]) => ({
        student_id: studentId,
        class_id: classId,
        date: date,
        amount: (data as { amount: number }).amount,
        description: (data as { description?: string }).description,
      }));

    // 2. Data untuk dihapus (amount <= 0 atau kosong)
    const studentIdsToDelete = Object.entries(infaqData)
      .filter(([, data]) => !(data as { amount: number }).amount || (data as { amount: number }).amount <= 0)
      .map(([studentId]) => studentId);

    // 3. Jalankan kedua operasi (jika ada data untuk diproses)
    const promises = [];

    if (recordsToUpsert.length > 0) {
      promises.push(
        supabase.from("infaq_records").upsert(recordsToUpsert, {
          onConflict: 'student_id, date'
        })
      );
    }

    if (studentIdsToDelete.length > 0) {
      promises.push(
        supabase.from("infaq_records")
          .delete()
          .eq('date', date)
          .in('student_id', studentIdsToDelete)
      );
    }

    const results = await Promise.all(promises);
    
    // Periksa apakah ada error dari salah satu operasi
    for (const result of results) {
      if (result.error) {
        console.error("Supabase operation error:", result.error);
        throw new Error("Gagal memproses sebagian data infaq.");
      }
    }

    return NextResponse.json({ message: "Data infaq berhasil disimpan!" });

  } catch (err: unknown) {
    const error = err as Error;
    console.error("API POST Infaq Error:", error.message);
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}

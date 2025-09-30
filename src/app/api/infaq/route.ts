import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Tipe untuk data yang diterima dari client saat menyimpan
type InfaqPayload = {
  [studentId: string]: { amount: number; description?: string };
};

// PERBAIKAN 1: Definisikan tipe data spesifik untuk hasil GET
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

        // PERBAIKAN 2: Ganti 'any' dengan tipe 'InfaqObject' yang sudah didefinisikan
        const infaqObject = data.reduce((acc: InfaqObject, record) => {
            acc[record.student_id] = {
                amount: record.amount,
                description: record.description
            };
            return acc;
        }, {} as InfaqObject);
        
        return NextResponse.json(infaqObject);

    } catch (err: unknown) {
        // PERBAIKAN 3: Lengkapi blok catch
        const error = err as Error;
        console.error("API GET Infaq Error:", error.message);
        return NextResponse.json({ error: "Terjadi kesalahan pada server saat mengambil data infaq." }, { status: 500 });
    }
}

// POST: Menyimpan (Upsert) data infaq
export async function POST(req: NextRequest) {
  try {
    const { classId, date, infaqData }: { classId: string, date: string, infaqData: InfaqPayload } = await req.json();

    if (!classId || !date || !infaqData) {
      return NextResponse.json({ error: "Data tidak lengkap." }, { status: 400 });
    }

    const recordsToUpsert = Object.entries(infaqData)
      .filter(([, data]) => data.amount > 0)
      .map(([studentId, data]) => ({
        student_id: studentId,
        class_id: classId,
        date: date,
        amount: data.amount,
        description: data.description,
      }));

    if (recordsToUpsert.length === 0) {
      return NextResponse.json({ message: "Tidak ada data infaq untuk disimpan." });
    }

    const { error } = await supabase
      .from("infaq_records")
      .upsert(recordsToUpsert, {
        onConflict: 'student_id, date'
      });

    if (error) {
        console.error("Supabase POST Infaq Error:", error);
        throw new Error("Gagal menyimpan data infaq ke database.");
    }

    return NextResponse.json({ message: "Data infaq berhasil disimpan!" });

  } catch (err: unknown) {
    // PERBAIKAN 3: Lengkapi blok catch
    const error = err as Error;
    console.error("API POST Infaq Error:", error.message);
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}
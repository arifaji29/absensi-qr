import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: Mengambil total keseluruhan infaq
export async function GET() {
  try {
    // Menjumlahkan semua nilai di kolom 'amount'
    const { data, error } = await supabase
      .from('infaq_records')
      .select('amount')
      .neq('amount', 0); // Hanya hitung yang nominalnya tidak nol

    if (error) throw error;

    // Hitung total dari data yang didapat
    const totalInfaq = data.reduce((sum, record) => sum + record.amount, 0);
    
    return NextResponse.json({ totalInfaq });

  } catch (err: unknown) {
    const error = err as Error;
    console.error("API GET Total Infaq Error:", error.message);
    return NextResponse.json({ error: "Gagal mengambil total infaq." }, { status: 500 });
  }
}
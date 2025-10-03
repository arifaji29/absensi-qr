import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: Sinkronkan, hitung saldo, DAN ambil riwayat transaksi
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const month = parseInt(searchParams.get('month')!, 10);
    const year = parseInt(searchParams.get('year')!, 10);

    if (isNaN(month) || isNaN(year)) {
        return NextResponse.json({ error: "Parameter month dan year tidak valid." }, { status: 400 });
    }

    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    const startDateString = startDate.toISOString().split('T')[0];
    const endDateString = endDate.toISOString().split('T')[0];

    // --- LOGIKA SINKRONISASI OTOMATIS (Tidak Berubah) ---
    const { data: dailyRecords, error: sumError } = await supabase
      .from('infaq_records')
      .select('date, amount')
      .gte('date', startDateString)
      .lte('date', endDateString);
    if (sumError) throw sumError;

    const actualTotalsByDate: Map<string, number> = new Map();
    for (const record of dailyRecords) {
      actualTotalsByDate.set(record.date, (actualTotalsByDate.get(record.date) || 0) + record.amount);
    }
    
    const { data: existingRecaps, error: existingError } = await supabase
        .from('infaq_ledger').select('id, date').eq('source', 'otomatis')
        .gte('date', startDateString)
        .lte('date', endDateString);
    if (existingError) throw existingError;

    const recordsToUpsert = Array.from(actualTotalsByDate.entries()).map(([date, totalAmount]) => ({
      date: date, type: 'masuk' as const, amount: totalAmount,
      description: 'Infaq Harian Semua Kelas', source: 'otomatis' as const,
    }));

    const datesWithInfaq = new Set(actualTotalsByDate.keys());
    const idsToDelete = existingRecaps.filter(recap => !datesWithInfaq.has(recap.date)).map(recap => recap.id);

    const syncPromises = [];
    if (recordsToUpsert.length > 0) {
      syncPromises.push(supabase.from('infaq_ledger').upsert(recordsToUpsert, { onConflict: 'date, description' }));
    }
    if (idsToDelete.length > 0) {
      syncPromises.push(supabase.from('infaq_ledger').delete().in('id', idsToDelete));
    }
    if(syncPromises.length > 0) {
        const syncResults = await Promise.all(syncPromises);
        for (const result of syncResults) { if (result.error) throw result.error; }
    }
    // --- AKHIR LOGIKA SINKRONISASI ---

    const { data: allTransactions, error: totalBalanceError } = await supabase
      .from('infaq_ledger')
      .select('type, amount');
    if (totalBalanceError) throw totalBalanceError;

    const totalBalance = allTransactions.reduce((acc, t) => acc + (t.type === 'masuk' ? t.amount : -t.amount), 0);
    
    const { data: openingBalanceData, error: openingError } = await supabase.from('infaq_ledger').select('type, amount').lt('date', startDateString);
    if (openingError) throw openingError;
    const openingBalance = openingBalanceData.reduce((acc, t) => acc + (t.type === 'masuk' ? t.amount : -t.amount), 0);

    // PERBAIKAN: Tambahkan pengurutan sekunder berdasarkan 'created_at'
    const { data: transactions, error: monthlyError } = await supabase
      .from('infaq_ledger')
      .select('*')
      .gte('date', startDateString)
      .lte('date', endDateString)
      .order('date', { ascending: true }) // Urutan utama: tanggal
      .order('created_at', { ascending: true }); // Urutan kedua: waktu dibuat
      
    if (monthlyError) throw monthlyError;
    
    return NextResponse.json({ openingBalance, transactions, totalBalance });

  } catch (err: unknown) {
    const error = err as Error;
    console.error("API GET Ledger Error:", error.message);
    return NextResponse.json({ error: "Gagal mengambil riwayat transaksi." }, { status: 500 });
  }
}

// POST: Membuat entri/laporan infaq baru (manual)
export async function POST(req: NextRequest) {
    try {
        const { date, type, amount, description } = await req.json();
        
        if (!date || !type || !amount) {
            return NextResponse.json({ error: "Tanggal, Tipe, dan Jumlah wajib diisi." }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('infaq_ledger')
            .insert({ date, type, amount, description, source: 'manual' })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data, { status: 201 });
    } catch (err: unknown) {
        const error = err as Error;
        console.error("API POST Ledger Error:", error.message);
        return NextResponse.json({ error: "Gagal membuat laporan baru." }, { status: 500 });
    }
}


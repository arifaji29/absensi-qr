// src/app/api/monitoring/attendance/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// --- LANGKAH 1: DEFINISIKAN TIPE DATA ---
// Tipe ini harus cocok dengan apa yang dikembalikan oleh fungsi RPC Anda
type MonitoringRpcResult = {
  student_id: string;
  name: string;
  nis: string;
  attendance_records: { date: string; status: string }[] | null;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const class_id = searchParams.get("class_id");
    const start_date = searchParams.get("start_date");
    const end_date = searchParams.get("end_date");

    if (!class_id || !start_date || !end_date) {
      return NextResponse.json(
        { error: "Parameter class_id, start_date, dan end_date diperlukan" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.rpc('get_class_attendance_monitoring', {
      p_class_id: class_id,
      p_start_date: start_date,
      p_end_date: end_date,
    });

    if (error) {
      console.error("Supabase RPC error:", error);
      throw error;
    }

    // --- LANGKAH 2: TERAPKAN TIPE PADA PARAMETER 'item' ---
    const formattedData = data.map((item: MonitoringRpcResult) => ({
      ...item,
      attendance_records: item.attendance_records || [],
    }));

    return NextResponse.json(formattedData);

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan pada server";
    console.error("API Error:", message);
    return NextResponse.json({ message }, { status: 500 });
  }
}
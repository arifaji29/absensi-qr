import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Pakai anon key saja (aman untuk public)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
    // Query ringan (misal cek tabel public yang selalu ada, atau pilih 1 record saja)
    const { data, error } = await supabase
      .from("students") // ganti dengan tabel yang pasti ada
      .select("id")
      .limit(1);

    if (error) throw error;

    return NextResponse.json({
      message: "Supabase is alive!",
      timestamp: new Date().toISOString(),
      data: data?.length ? "Connected" : "No data (but alive)",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ message }, { status: 500 });
  }
}

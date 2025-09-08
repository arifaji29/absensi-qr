export const runtime = "edge"; // gunakan Edge Runtime

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Query sederhana untuk menjaga koneksi tetap aktif
    const { error } = await supabase.from("teachers").select("id").limit(1);
    if (error) throw error;

    return NextResponse.json({ success: true, message: "Supabase pinged!" });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: (error as Error).message },
      { status: 500 }
    );
  }
}

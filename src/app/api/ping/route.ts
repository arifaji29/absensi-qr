import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabase.from("attendance_records").select("id").limit(1);
    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Ping sukses, Supabase tetap aktif",
      checked: data?.length ?? 0,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err instanceof Error ? err.message : "Ping gagal" },
      { status: 500 }
    );
  }
}

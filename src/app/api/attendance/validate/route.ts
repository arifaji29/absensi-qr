import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { class_id, date, validator_id } = await req.json();
    if (!class_id || !date || !validator_id) {
      return NextResponse.json({ message: "Parameter class_id, date, dan validator_id diperlukan" }, { status: 400 });
    }
    const { error } = await supabase.from("daily_attendance_validation").upsert({ class_id, date, is_validated: true, validated_at: new Date().toISOString(), validator_id }, { onConflict: "class_id, date" });
    if (error) throw error;
    return NextResponse.json({ message: "Absensi berhasil divalidasi." });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal memvalidasi absensi";
    return NextResponse.json({ message }, { status: 500 });
  }
}


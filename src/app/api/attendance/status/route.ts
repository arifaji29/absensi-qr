import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const class_id = searchParams.get("class_id");
    const date = searchParams.get("date");

    if (!class_id || !date) {
      return NextResponse.json({ message: "Parameter tidak lengkap" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("daily_attendance_validation")
      .select(`
        is_validated,
        teachers ( name )
      `)
      .eq("class_id", class_id)
      .eq("date", date)
      .single();

    if (error) {
      return NextResponse.json({ isValidated: false, validatorName: null });
    }
    
    // --- PERBAIKAN FINAL DI SINI ---
    // Logika yang lebih jelas untuk mengekstrak nama validator
    // Karena relasinya one-to-one, 'teachers' akan menjadi objek, bukan array.
    const validatorName = (data?.teachers && typeof data.teachers === 'object' && !Array.isArray(data.teachers))
      ? (data.teachers as { name: string }).name
      : null;

    return NextResponse.json({
      isValidated: data?.is_validated || false,
      validatorName: validatorName,
    });

  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}


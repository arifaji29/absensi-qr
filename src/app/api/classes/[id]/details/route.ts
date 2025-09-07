import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: Mengambil detail (seperti nama) dari satu kelas
// PERBAIKAN: Menggunakan format yang benar dan penanganan error yang lebih baik
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { data, error } = await supabase
      .from("classes")
      .select("name")
      .eq("id", id)
      .single();

    if (error) {
      // Jika Supabase mengembalikan error (misal: data tidak ditemukan)
      throw new Error(error.message);
    }
    
    return NextResponse.json(data);

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Kelas tidak ditemukan";
    return NextResponse.json({ message }, { status: 404 });
  }
}


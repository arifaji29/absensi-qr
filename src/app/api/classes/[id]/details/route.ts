import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: Mengambil detail (seperti nama) dari satu kelas
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { data, error } = await supabase
      .from("classes")
      .select("name")
      .eq("id", id)
      .single();

    if (error) throw error;
    return NextResponse.json(data);
    
  } catch (error: any) {
    return NextResponse.json({ message: "Kelas tidak ditemukan" }, { status: 404 });
  }
}


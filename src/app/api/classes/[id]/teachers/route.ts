import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// PERBAIKAN: Tipe data untuk hasil join dari Supabase
type ClassTeacherLink = {
  teachers: {
    id: string;
    name: string;
  }[] | null; // teachers adalah ARRAY dari objek guru
};

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { data, error } = await supabase
      .from("class_teachers")
      .select(`teachers (id, name)`)
      .eq("class_id", id);
      
    if (error) throw error;

    // PERBAIKAN: Karena `item.teachers` adalah sebuah array,
    // kita gunakan flatMap untuk mengekstrak dan meratakan hasilnya menjadi satu array tunggal.
    const teachers = data.flatMap((item: ClassTeacherLink) => item.teachers || []);

    return NextResponse.json(teachers);

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ message }, { status: 500 });
  }
}


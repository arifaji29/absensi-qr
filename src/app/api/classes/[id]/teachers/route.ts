import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ message: "ID Kelas diperlukan" }, { status: 400 });
    }
    const { data, error } = await supabase.from("class_teachers").select(`teachers ( id, name )`).eq("class_id", id);
    if (error) {
      console.error("Supabase error fetching teachers for class:", error);
      throw error;
    }
    const teachers = data.map((item: { teachers: unknown }) => item.teachers).filter(Boolean);
    return NextResponse.json(teachers);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal mengambil data";
    return NextResponse.json({ message }, { status: 500 });
  }
}


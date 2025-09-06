import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: Mendukung filter berdasarkan class_id
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("class_id");

    let query = supabase.from("students").select("*").order("name");

    if (classId && classId.trim() !== "") {
      query = query.eq("class_id", classId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Terjadi kesalahan" }, { status: 500 });
  }
}

// POST: Tambah siswa dengan prioritas class_id dari query
export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const classIdFromQuery = searchParams.get("class_id");

    const { nis, name, gender, date_of_birth, class_id: classIdFromBody } = await req.json();

    const finalClassId = classIdFromQuery || classIdFromBody || null;

    const { data, error } = await supabase
      .from("students")
      .insert([{ nis, name, gender, date_of_birth, class_id: finalClassId }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal menambahkan siswa" }, { status: 400 });
  }
}

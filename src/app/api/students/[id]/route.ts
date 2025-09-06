import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// PATCH (update data siswa, dengan prioritas class_id dari query)
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const classIdFromQuery = searchParams.get("class_id");

    const body = await request.json();
    const finalClassId = classIdFromQuery || body.class_id || null;

    const { data, error } = await supabase
      .from("students")
      .update({
        nis: body.nis,
        name: body.name, // konsisten
        gender: body.gender,
        date_of_birth: body.date_of_birth, // konsisten
        class_id: finalClassId
      })
      .eq("id", id)
      .select();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// DELETE (hapus data siswa)
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const { error } = await supabase
      .from("students")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

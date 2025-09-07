import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { name, teacherIds } = await req.json();

    if (!name) {
      return NextResponse.json({ message: "Nama kelas wajib diisi" }, { status: 400 });
    }

    const { error } = await supabase.rpc('update_class_with_teachers', {
      p_class_id: id,
      p_class_name: name,
      p_teacher_ids: teacherIds
    });
    
    if (error) {
      console.error("Supabase RPC Error:", error);
      throw error;
    }

    return NextResponse.json({ message: "Kelas berhasil diperbarui" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const { error } = await supabase.from('classes').delete().eq('id', id);
        if (error) throw error;
        return NextResponse.json({ message: 'Kelas berhasil dihapus' });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Terjadi kesalahan";
        return NextResponse.json({ message }, { status: 500 });
    }
}


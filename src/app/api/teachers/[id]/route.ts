import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// PUT: Mengedit data pengajar
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { no_induk, name, email } = await req.json();

    if (!name || !no_induk) {
      return NextResponse.json({ message: "Nomor Induk dan Nama wajib diisi" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("teachers")
      .update({ no_induk, name, email })
      .eq("id", id)
      .select()
      .single();

    if (error) {
        console.error("Supabase Update Error:", error);
        throw new Error(error.message);
    }
    return NextResponse.json(data);

  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// DELETE: Menghapus data pengajar
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { error } = await supabase.from("teachers").delete().eq("id", id);
    if (error) {
        console.error("Supabase Delete Error:", error);
        throw new Error(error.message);
    }
    return NextResponse.json({ message: "Pengajar berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}


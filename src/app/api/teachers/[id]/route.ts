import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { no_induk, name, email } = await req.json();

    if (!name || !no_induk) {
      return NextResponse.json(
        { message: "Nomor Induk dan Nama wajib diisi" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("teachers")
      .update({ no_induk, name, email })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const { error } = await supabase.from("teachers").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ message: "Pengajar berhasil dihapus" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ message }, { status: 500 });
  }
}

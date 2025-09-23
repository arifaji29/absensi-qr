// Lokasi file: src/app/api/teachers/[id]/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// PUT: Memperbarui data pengajar berdasarkan ID
export async function PUT(
  req: Request,
  // PERBAIKAN: Kembalikan ke struktur 'context'
  context: { params: Promise<{ id: string }> }
) {
  try {
    // PERBAIKAN: Tambahkan kembali 'await'
    const { id } = await context.params;
    const { name, email } = await req.json();

    if (!name) {
      return NextResponse.json(
        { message: "Nama wajib diisi" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("teachers")
      .update({ name, email })
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

// DELETE: Menghapus data pengajar berdasarkan ID
export async function DELETE(
  req: Request,
  // PERBAIKAN: Kembalikan ke struktur 'context'
  context: { params: Promise<{ id: string }> }
) {
  try {
    // PERBAIKAN: Tambahkan kembali 'await'
    const { id } = await context.params;

    const { error } = await supabase.from("teachers").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ message: "Pengajar berhasil dihapus" });
    
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ message }, { status: 500 });
  }
}
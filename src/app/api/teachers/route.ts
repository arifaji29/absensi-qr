import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: Mengambil semua data dari tabel 'teachers'
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("teachers")
      .select("id, no_induk, name, email") // <-- PERBAIKAN DI SINI: Pilih semua kolom yang diperlukan
      .order("name", { ascending: true }); // Urutkan berdasarkan nama

    if (error) {
      throw error;
    }

    return NextResponse.json(data);

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ message }, { status: 500 });
  }
}

// POST: Membuat data pengajar baru
export async function POST(req: Request) {
  try {
    const { no_induk, name, email } = await req.json();

    if (!name || !no_induk) {
      return NextResponse.json({ message: "Nomor Induk dan Nama wajib diisi" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("teachers")
      .insert({ no_induk, name, email })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ message }, { status: 500 });
  }
}
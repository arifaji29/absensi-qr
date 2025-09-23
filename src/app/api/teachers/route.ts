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
      // PERUBAHAN: 'no_induk' dihapus dari query select
      .select("id, name, email")
      .order("name", { ascending: true });

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
    // PERUBAHAN: 'no_induk' dihapus dari body request
    const { name, email } = await req.json();

    // PERUBAHAN: Validasi hanya untuk 'name', pesan error disesuaikan
    if (!name) {
      return NextResponse.json({ message: "Nama wajib diisi" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("teachers")
      // PERUBAHAN: 'no_induk' dihapus dari data yang akan disimpan
      .insert({ name, email })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ message }, { status: 500 });
  }
}
// Lokasi file: src/app/api/journal/[id]/route.ts

import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Paksa route ini untuk selalu dinamis
export const dynamic = "force-dynamic";

// Inisialisasi Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Handler untuk DELETE request (menghapus jurnal berdasarkan ID)
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } // params sekarang Promise
) {
  try {
    // Harus tunggu params
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: "ID Jurnal dibutuhkan." }, { status: 400 });
    }

    // Hapus data dari tabel 'journals' berdasarkan ID
    const { error } = await supabase
      .from("journals")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Supabase DELETE Jurnal Error:", error);
      throw new Error("Gagal menghapus jurnal dari database.");
    }

    return NextResponse.json({ message: "Jurnal berhasil dihapus." });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("API DELETE Jurnal Error:", error.message);
    return NextResponse.json(
      { error: error.message || "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}

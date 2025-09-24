import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Handler untuk DELETE request (menghapus aspek penilaian berdasarkan ID)
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: "ID Aspek dibutuhkan." }, { status: 400 });
    }

    // Menghapus aspek dari tabel assessment_aspects
    // Karena ada 'ON DELETE CASCADE' di tabel student_scores,
    // semua nilai yang terkait akan otomatis terhapus.
    const { error } = await supabase
      .from("assessment_aspects")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Supabase delete error:", error);
      throw new Error("Gagal menghapus aspek dari database.");
    }

    return NextResponse.json({ message: "Aspek penilaian berhasil dihapus." });

  } catch (err: unknown) {
    const error = err as Error;
    console.error("API DELETE Error:", error.message);
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan pada server.' },
      { status: 500 }
    );
  }
}
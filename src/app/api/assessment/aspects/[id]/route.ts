import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Context =
  | { params: { id: string } }
  | { params: Promise<{ id: string }> };

// Handler untuk DELETE request (menghapus aspek penilaian berdasarkan ID)
export async function DELETE(req: NextRequest, context: Context) {
  try {
    // dukung kalau params berupa Promise
    const resolvedParams =
      "then" in context.params // kalau Promise, ada method "then"
        ? await context.params
        : context.params;

    const { id } = resolvedParams;

    if (!id) {
      return NextResponse.json(
        { error: "ID Aspek dibutuhkan." },
        { status: 400 }
      );
    }

    // Hapus aspek dari tabel assessment_aspects
    const { error } = await supabase
      .from("assessment_aspects")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Supabase delete error:", error);
      return NextResponse.json(
        { error: "Gagal menghapus aspek dari database." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Aspek penilaian berhasil dihapus.",
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("API DELETE Error:", error.message);
    return NextResponse.json(
      { error: error.message || "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}

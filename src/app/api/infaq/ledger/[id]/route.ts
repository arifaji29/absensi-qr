// src/app/api/infaq/ledger/[id]/route.ts

import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

// WAJIB: Baris ini memaksa Next.js untuk selalu menjalankan route ini secara dinamis.
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// PUT: Mengupdate data transaksi berdasarkan ID
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { date, type, amount, description } = await req.json();

    if (!date || !type || typeof amount === "undefined") {
      return NextResponse.json(
        { error: "Tanggal, Tipe, dan Jumlah wajib diisi." },
        { status: 400 }
      );
    }
    if (typeof amount !== "number" || amount < 0) {
      return NextResponse.json(
        { error: "Jumlah harus berupa angka positif." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("infaq_ledger")
      .update({
        date,
        type,
        amount,
        description,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Supabase PUT Ledger Error:", error);
      throw new Error("Gagal memperbarui transaksi di database.");
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    const error = err as Error;
    console.error("API PUT Ledger Error:", error.message);
    return NextResponse.json(
      { error: error.message || "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}

// DELETE: Menghapus data transaksi berdasarkan ID
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "ID transaksi dibutuhkan." },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("infaq_ledger").delete().eq("id", id);

    if (error) {
      console.error("Supabase DELETE Ledger Error:", error);
      throw new Error("Gagal menghapus transaksi dari database.");
    }

    return NextResponse.json({ message: "Transaksi berhasil dihapus." });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("API DELETE Ledger Error:", error.message);
    return NextResponse.json(
      { error: error.message || "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const body = await req.json();
        const { data, error } = await supabase.from("students").update(body).eq("id", id).select().single();
        if (error) throw error;
        return NextResponse.json(data);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Gagal mengedit siswa";
        return NextResponse.json({ message }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const { error } = await supabase.from("students").delete().eq("id", id);
        if (error) throw error;
        return NextResponse.json({ message: "Siswa berhasil dihapus" });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Gagal menghapus siswa";
        return NextResponse.json({ message }, { status: 500 });
    }
}


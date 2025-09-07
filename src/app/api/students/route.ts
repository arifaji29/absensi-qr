import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const class_id = searchParams.get("class_id");

        let query = supabase.from('students').select('*').order('name');
        if (class_id) {
            query = query.eq('class_id', class_id);
        }

        const { data, error } = await query;
        if (error) throw error;
        return NextResponse.json(data);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Gagal mengambil data siswa";
        return NextResponse.json({ message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { data, error } = await supabase.from('students').insert(body).select().single();
        if (error) throw error;
        return NextResponse.json(data, { status: 201 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Gagal menambah siswa";
        return NextResponse.json({ message }, { status: 500 });
    }
}


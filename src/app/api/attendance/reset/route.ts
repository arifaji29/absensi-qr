import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const class_id = searchParams.get('class_id');
        const date = searchParams.get('date');

        if (!class_id || !date) {
            return NextResponse.json({ error: "Parameter class_id dan date wajib diisi." }, { status: 400 });
        }

        const { error: recordsError } = await supabase
            .from('attendance_records')
            .delete()
            .match({ class_id: class_id, date: date });

        if (recordsError) throw new Error("Gagal menghapus rincian absensi.");

        const { error: validationError } = await supabase
            .from('daily_attendance_validation')
            .delete()
            .match({ class_id: class_id, date: date });

        if (validationError) {
            console.warn("Could not delete validation record:", validationError);
        }
        
        return NextResponse.json({ message: "Absensi berhasil direset dan form telah dibuka kembali." });

    } catch (err: unknown) { // PERBAIKAN: Ganti 'any' dengan 'unknown'
        const error = err as Error;
        console.error("API Reset Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
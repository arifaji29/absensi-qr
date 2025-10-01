import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
    try {
        const { class_id, date, attendanceData } = await req.json();

        if (!class_id || !date || !attendanceData) {
            return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
        }

        const recordsToUpsert = attendanceData.map((att: any) => ({
            class_id: class_id,
            date: date,
            student_id: att.student_id,
            status: att.status,
            time: (att.status === 'Hadir' && !att.checked_in_at) ? new Date().toISOString() : att.checked_in_at,
        }));

        if (recordsToUpsert.length === 0) {
            return NextResponse.json({ message: "Tidak ada data untuk disimpan." });
        }

        const { error } = await supabase
            .from('attendance_records')
            .upsert(recordsToUpsert, { onConflict: 'class_id, student_id, date' });

        if (error) {
            console.error("Supabase Bulk Update Error:", error);
            throw error;
        }

        return NextResponse.json({ message: "Data absensi berhasil disimpan." });

    } catch (error: any) {
        console.error("API Bulk Update Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
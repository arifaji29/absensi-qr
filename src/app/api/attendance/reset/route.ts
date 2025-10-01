import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// DELETE: Menghapus data absensi DAN status validasinya
export async function DELETE(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const class_id = searchParams.get('class_id');
        const date = searchParams.get('date');

        if (!class_id || !date) {
            return NextResponse.json({ error: "Parameter class_id dan date wajib diisi." }, { status: 400 });
        }

        // 1. Hapus semua record absensi untuk kelas dan tanggal tersebut
        const { error: recordsError } = await supabase
            .from('attendance_records')
            .delete()
            .match({ class_id: class_id, date: date });

        if (recordsError) {
            console.error("Error deleting attendance records:", recordsError);
            throw new Error("Gagal menghapus rincian absensi.");
        }

        // PERUBAHAN: Hapus juga record validasi untuk kelas dan tanggal tersebut
        const { error: validationError } = await supabase
            .from('daily_attendance_validation')
            .delete()
            .match({ class_id: class_id, date: date });

        // Tidak apa-apa jika record validasi tidak ada, jadi kita tidak perlu menghentikan proses jika ada error di sini
        if (validationError) {
            console.warn("Could not delete validation record (it might not exist):", validationError);
        }
        
        return NextResponse.json({ message: "Absensi berhasil direset dan form telah dibuka kembali." });

    } catch (error: any) {
        console.error("API Reset Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
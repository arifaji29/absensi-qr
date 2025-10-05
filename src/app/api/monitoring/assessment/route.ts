import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Inisialisasi Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Tipe untuk mempermudah akses skor
type ScoresObject = {
  [studentId: string]: { [aspectId: string]: string | number };
};

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const class_id = searchParams.get("class_id");
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    if (!class_id || !month || !year) {
      return NextResponse.json(
        { error: "Parameter class_id, month, dan year wajib diisi." },
        { status: 400 }
      );
    }

    // =========================
    // FIX: Gunakan waktu lokal agar tidak bergeser karena UTC
    // =========================
    const monthNum = Number(month);
    const yearNum = Number(year);

    const start = new Date(yearNum, monthNum, 1);
    const end = new Date(yearNum, monthNum + 1, 0);

    // Format aman untuk tanggal lokal (YYYY-MM-DD)
    const startDate = start.toLocaleDateString("en-CA");
    const endDate = end.toLocaleDateString("en-CA");

    // 1️⃣ Ambil semua aspek penilaian di bulan tersebut
    const { data: aspects, error: aspectsError } = await supabase
      .from("assessment_aspects")
      .select("id, name, scale_type, date")
      .eq("class_id", class_id)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true })
      .order("created_at", { ascending: true });

    if (aspectsError) throw aspectsError;

    // 2️⃣ Proses nama aspek agar menyertakan tanggal (contoh: "Tajwid (05/10)")
    const processedAspects =
      aspects?.map((aspect) => {
        const dateObj = new Date(aspect.date + "T00:00:00");
        const day = dateObj.getDate().toString().padStart(2, "0");
        const monthNum = (dateObj.getMonth() + 1).toString().padStart(2, "0");

        return {
          id: aspect.id,
          name: `${aspect.name} (${day}/${monthNum})`,
          scale_type: aspect.scale_type,
        };
      }) || [];

    // 3️⃣ Ambil semua siswa di kelas tersebut
    const { data: students, error: studentsError } = await supabase
      .from("students")
      .select("id, name")
      .eq("class_id", class_id)
      .order("name", { ascending: true });

    if (studentsError) throw studentsError;

    const studentIds = students.map((s) => s.id);

    // 4️⃣ Ambil semua skor siswa sesuai rentang tanggal
    const { data: scores, error: scoresError } = await supabase
      .from("student_scores")
      .select("student_id, aspect_id, score_numeric, score_qualitative, date")
      .in("student_id", studentIds)
      .gte("date", startDate)
      .lte("date", endDate);

    if (scoresError) throw scoresError;

    // 5️⃣ Ubah hasil skor ke bentuk objek untuk frontend
    const scoresObject = scores.reduce((acc: ScoresObject, score) => {
      if (!acc[score.student_id]) {
        acc[score.student_id] = {};
      }
      acc[score.student_id][score.aspect_id] =
        score.score_numeric ?? score.score_qualitative;
      return acc;
    }, {} as ScoresObject);

    // ✅ Kirim data hasil akhir
    return NextResponse.json({
      students,
      aspects: processedAspects,
      scores: scoresObject,
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("API Monitoring Assessment Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

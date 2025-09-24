import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Tipe data untuk body request yang diharapkan
type ScorePayload = {
  [studentId: string]: {
    [aspectId: string]: string | number;
  };
};

type RequestBody = {
  classId: string;
  date: string;
  scores: ScorePayload;
};

// Handler untuk POST request (menyimpan atau update nilai siswa)
export async function POST(req: NextRequest) {
  try {
    const { classId, date, scores }: RequestBody = await req.json();

    if (!classId || !date || !scores) {
      return NextResponse.json(
        { error: "Parameter classId, date, dan scores wajib diisi." },
        { status: 400 }
      );
    }

    const recordsToUpsert = [];
    for (const studentId in scores) {
      for (const aspectId in scores[studentId]) {
        const value = scores[studentId][aspectId];
        
        if (value === '' || value === null || value === undefined) {
          continue;
        }

        const record = {
          student_id: studentId,
          aspect_id: aspectId,
          date: date,
          score_numeric: typeof value === 'number' ? value : null,
          score_qualitative: typeof value === 'string' ? value : null,
        };
        recordsToUpsert.push(record);
      }
    }

    if (recordsToUpsert.length === 0) {
      return NextResponse.json({ message: "Tidak ada data nilai baru untuk disimpan." });
    }

    const { error } = await supabase
      .from("student_scores")
      .upsert(recordsToUpsert, {
        onConflict: 'student_id, aspect_id, date'
      });

    if (error) {
      console.error("Supabase upsert error:", error);
      throw new Error("Gagal menyimpan nilai ke database.");
    }

    return NextResponse.json({ message: "Semua nilai berhasil disimpan!" });

  } catch (err: unknown) {
    const error = err as Error;
    console.error("API POST Error:", error.message);
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan pada server.' },
      { status: 500 }
    );
  }
}

// Handler untuk GET request (mengambil data nilai yang sudah tersimpan)
export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const class_id = searchParams.get('class_id');
        const date = searchParams.get('date');

        if (!class_id || !date) {
            return NextResponse.json({ error: "Parameter class_id dan date wajib diisi." }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('student_scores')
            .select('student_id, aspect_id, score_numeric, score_qualitative')
            .eq('date', date);
        
        if (error) {
            console.error("Supabase GET error:", error);
            throw error;
        }

        // Filter data berdasarkan siswa di kelas yang bersangkutan
        // Ini lebih efisien daripada subquery di dalam .eq()
        const { data: studentsInClass, error: studentError } = await supabase
            .from('students')
            .select('id')
            .eq('class_id', class_id);

        if (studentError) throw studentError;

        const studentIds = studentsInClass.map(s => s.id);
        const filteredData = data.filter(score => studentIds.includes(score.student_id));
        
        // Ubah format data array menjadi object agar mudah diakses di frontend
        const scoresObject = filteredData.reduce((acc: any, score) => {
            if (!acc[score.student_id]) {
                acc[score.student_id] = {};
            }
            acc[score.student_id][score.aspect_id] = score.score_numeric ?? score.score_qualitative;
            return acc;
        }, {});
        
        return NextResponse.json(scoresObject);

    } catch (err: unknown) {
        const error = err as Error;
        console.error("API GET Error:", error.message);
        return NextResponse.json(
            { error: error.message || 'Terjadi kesalahan pada server.' }, 
            { status: 500 }
        );
    }
}
import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type ScoresObject = { [studentId: string]: { [aspectId: string]: string | number } };

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const class_id = searchParams.get('class_id');
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    if (!class_id || !month || !year) {
      return NextResponse.json({ error: "Parameter class_id, month, dan year wajib diisi." }, { status: 400 });
    }

    const startDate = new Date(parseInt(year), parseInt(month), 1).toISOString();
    const endDate = new Date(parseInt(year), parseInt(month) + 1, 0).toISOString();

    const { data: aspects, error: aspectsError } = await supabase
      .from('assessment_aspects')
      .select('id, name, scale_type, date')
      .eq('class_id', class_id)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })
      .order('created_at', { ascending: true });

    if (aspectsError) throw aspectsError;

    // ==========================================================
    // === PERBAIKAN: Logika penamaan aspek disederhanakan ===
    // ==========================================================
    const processedAspects = aspects.map(aspect => {
        // Ambil tanggalnya (misal: '21' dari '2025-09-21')
        const day = aspect.date.split('-')[2];
        
        // Buat objek baru dengan nama yang sudah ditambahkan tanggal
        return {
            id: aspect.id,
            name: `${aspect.name} (${day})`, // Cth: "Hafalan (25)"
            scale_type: aspect.scale_type,
        };
    });

    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, name')
      .eq('class_id', class_id)
      .order('name', { ascending: true });

    if (studentsError) throw studentsError;

    const studentIds = students.map(s => s.id);
    const { data: scores, error: scoresError } = await supabase
      .from('student_scores')
      .select('student_id, aspect_id, score_numeric, score_qualitative')
      .in('student_id', studentIds)
      .gte('date', startDate)
      .lte('date', endDate);

    if (scoresError) throw scoresError;

    const scoresObject = scores.reduce((acc: ScoresObject, score) => {
        if (!acc[score.student_id]) {
            acc[score.student_id] = {};
        }
        acc[score.student_id][score.aspect_id] = score.score_numeric ?? score.score_qualitative;
        return acc;
    }, {} as ScoresObject);
    
    return NextResponse.json({ students, aspects: processedAspects, scores: scoresObject });

  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
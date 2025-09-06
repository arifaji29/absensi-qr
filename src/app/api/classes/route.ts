import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: Mengambil semua kelas beserta daftar pengajarnya
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("classes")
      .select(`
        id,
        name,
        class_teachers (
          teachers (
            id,
            name
          )
        )
      `)
      .order("name", { ascending: true });

    if (error) throw error;

    // Memformat data agar lebih mudah digunakan di frontend
    const formattedData = data.map(cls => ({
        id: cls.id,
        name: cls.name,
        // Ubah struktur bersarang menjadi array pengajar yang sederhana
        teachers: cls.class_teachers.map((ct: any) => ct.teachers)
    }));

    return NextResponse.json(formattedData);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// POST: Membuat kelas baru dan menugaskan pengajarnya
export async function POST(req: Request) {
  try {
    const { name, teacherIds } = await req.json(); // teacherIds adalah array [id1, id2, ...]

    if (!name) {
      return NextResponse.json({ message: "Nama kelas wajib diisi" }, { status: 400 });
    }

    // 1. Buat kelas baru di tabel 'classes'
    const { data: newClass, error: classError } = await supabase
      .from("classes")
      .insert({ name: name })
      .select()
      .single();

    if (classError) throw classError;

    // 2. Jika ada pengajar yang dipilih, tugaskan mereka di tabel 'class_teachers'
    if (teacherIds && teacherIds.length > 0) {
      const assignments = teacherIds.map((teacher_id: string) => ({
        class_id: newClass.id,
        teacher_id: teacher_id,
      }));

      const { error: assignmentError } = await supabase
        .from("class_teachers")
        .insert(assignments);

      if (assignmentError) throw assignmentError;
    }

    return NextResponse.json(newClass, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

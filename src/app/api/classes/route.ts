import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabase.from("classes").select(`id, name, class_teachers ( teachers ( id, name ) )`).order("name", { ascending: true });
    if (error) throw error;
    const formattedData = data.map(cls => ({ id: cls.id, name: cls.name, teachers: cls.class_teachers.map((ct: { teachers: unknown }) => ct.teachers) }));
    return NextResponse.json(formattedData);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal mengambil data";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, teacherIds } = await req.json();
    if (!name) {
      return NextResponse.json({ message: "Nama kelas wajib diisi" }, { status: 400 });
    }
    const { data: newClass, error: classError } = await supabase.from("classes").insert({ name: name }).select().single();
    if (classError) throw classError;
    if (teacherIds && teacherIds.length > 0) {
      const assignments = teacherIds.map((teacher_id: string) => ({ class_id: newClass.id, teacher_id: teacher_id }));
      const { error: assignmentError } = await supabase.from("class_teachers").insert(assignments);
      if (assignmentError) throw assignmentError;
    }
    return NextResponse.json(newClass, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal menambah kelas";
    return NextResponse.json({ message }, { status: 500 });
  }
}


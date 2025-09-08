import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type ClassTeacherLink = {
  teachers: {
    id: string;
    name: string;
  }[] | null;
};

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const { data, error } = await supabase
      .from("class_teachers")
      .select(`teachers (id, name)`)
      .eq("class_id", id);

    if (error) throw error;

    const teachers = data.flatMap((item: ClassTeacherLink) => item.teachers || []);

    return NextResponse.json(teachers);

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ message }, { status: 500 });
  }
}

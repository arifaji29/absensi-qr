import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Ambil params dari Promise
    const { id } = await context.params;

    const { data, error } = await supabase
      .from("classes")
      .select("name")
      .eq("id", id)
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json(data);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Kelas tidak ditemukan";
    return NextResponse.json({ message }, { status: 404 });
  }
}

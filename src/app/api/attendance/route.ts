import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Tipe untuk hasil mentah dari fungsi RPC (tanpa NIS)
type RpcResult = {
  student_id: string;
  name: string;
  status: string;
  time_in: string | null;
  is_validated: boolean;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const class_id = searchParams.get("class_id");
    const date = searchParams.get("date");

    if (!class_id || !date) {
      return NextResponse.json({ error: "class_id dan date wajib diisi" }, { status: 400 });
    }

    const { data, error } = await supabase.rpc('get_class_attendance', {
      p_class_id: class_id,
      p_date: date,
    });

    if (error) throw error;

    // Mapping data tanpa menyertakan NIS
    const formattedData = data.map((item: RpcResult) => ({
      student_id: item.student_id,
      name: item.name,
      status: item.status,
      checked_in_at: item.time_in,
      is_validated: item.is_validated,
    }));

    return NextResponse.json(formattedData);

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ message }, { status: 500 });
  }
}
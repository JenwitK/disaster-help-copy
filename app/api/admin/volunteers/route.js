import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabaseServer";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("users_app")
      .select("id, full_name, email, phone_number, role, is_approved, created_at")
      .eq("role", "volunteer")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์" }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const { id, is_approved } = await req.json();

    if (!id || is_approved === undefined) {
      return NextResponse.json({ error: "ข้อมูลไม่ครบ (id, is_approved)" }, { status: 400 });
    }

    const { error } = await supabase
      .from("users_app")
      .update({ is_approved })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์" }, { status: 500 });
  }
}

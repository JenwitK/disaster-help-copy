import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabaseServer";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("incidents")
      .select(`
        id,
        title,
        description,
        status,
        approval_status,
        lat,
        lng,
        created_at,
        users_app (
          id,
          full_name,
          email,
          phone_number
        ),
        incident_media (
          id,
          file_url
        ),
        assignments (
          volunteer_id,
          status,
          users_app (
            full_name,
            phone_number
          )
        )
      `)
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
    const { id, approval_status } = await req.json();

    if (!id || !approval_status) {
      return NextResponse.json({ error: "ข้อมูลไม่ครบ (id, approval_status)" }, { status: 400 });
    }

    const { error } = await supabase
      .from("incidents")
      .update({ approval_status })
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

export async function DELETE(req) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "ไม่มี id" }, { status: 400 });
    }

    await supabase.from("assignments").delete().eq("incident_id", id);
    await supabase.from("incident_logs").delete().eq("incident_id", id);
    await supabase.from("incident_media").delete().eq("incident_id", id);

    const { error } = await supabase.from("incidents").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์" }, { status: 500 });
  }
}

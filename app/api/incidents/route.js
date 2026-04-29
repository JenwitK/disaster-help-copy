// app/api/incidents/route.js
import { NextResponse } from "next/server";
import { supabase } from "../../lib/supabaseServer";

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
        assignments (
          volunteer_id,
          users_app (
            full_name
          )
        ),
        incident_media (
          id,
          file_url
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "ดึงข้อมูลไม่สำเร็จ", detail: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("Server error:", err);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { user_id, title, description, lat, lng } = body;

    if (!user_id || !title || lat == null || lng == null) {
      return NextResponse.json(
        { error: "ข้อมูลไม่ครบ" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("incidents")
      .insert([
        {
          user_id,
          title,
          description: description || "",
          status: "รอการช่วยเหลือ",
          approval_status: "pending",
          lat,
          lng,
        },
      ])
      .select();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "บันทึกข้อมูลไม่สำเร็จ", detail: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("Server error:", err);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์" },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    const body = await req.json();
    const { id } = body;

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
    console.error("Server error:", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์" }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const body = await req.json();
    const { id, status, title, description, lat, lng, deleteMediaIds } = body;

    if (!id) {
      return NextResponse.json({ error: "ไม่มี id" }, { status: 400 });
    }

    const updates = {};
    if (status !== undefined) updates.status = status;
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (lat !== undefined) updates.lat = lat;
    if (lng !== undefined) updates.lng = lng;

    if (Object.keys(updates).length === 0 && !deleteMediaIds?.length) {
      return NextResponse.json({ error: "ไม่มีข้อมูลที่ต้องอัปเดต" }, { status: 400 });
    }

    if (deleteMediaIds?.length) {
      await supabase.from("incident_media").delete().in("id", deleteMediaIds);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: true });
    }

    const { data, error } = await supabase
      .from("incidents")
      .update(updates)
      .eq("id", id)
      .select();

    if (error) {
      console.error("Supabase update error:", error);
      return NextResponse.json(
        { error: "อัปเดตสถานะไม่สำเร็จ", detail: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("Server error:", err);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์" },
      { status: 500 }
    );
  }
}

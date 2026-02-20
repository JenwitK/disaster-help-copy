// app/api/incidents/route.js
import { NextResponse } from "next/server";
import { supabase } from "../../lib/supabaseServer";

// 👉 ดึง incidents ทั้งหมด พร้อมชื่อผู้รายงาน
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("incidents")
      .select(`
        id,
        title,
        description,
        status,
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

// 👉 เพิ่ม incident ใหม่
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

// 👉 อัปเดตสถานะ incident
export async function PATCH(req) {
  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: "ข้อมูลไม่ครบถ้วน (id, status)" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("incidents")
      .update({ status })
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

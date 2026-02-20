import { NextResponse } from "next/server";
import { supabase } from "../../lib/supabaseServer";

export async function POST(req) {
    try {
        const body = await req.json();
        const { incident_id, volunteer_id, status } = body;

        if (!incident_id || !volunteer_id) {
            return NextResponse.json(
                { error: "ข้อมูลไม่ครบถ้วน (incident_id, volunteer_id)" },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from("assignments")
            .insert([
                {
                    incident_id,
                    volunteer_id,
                    status: status || "accepted",
                },
            ])
            .select();

        if (error) {
            console.error("Supabase error (assignments):", error);
            return NextResponse.json(
                { error: "บันทึกการรับงานไม่สำเร็จ", detail: error.message },
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

// 👉 อัปเดตสถานะ assignment
export async function PATCH(req) {
    try {
        const body = await req.json();
        const { incident_id, volunteer_id, status } = body;

        if (!incident_id || !volunteer_id || !status) {
            return NextResponse.json(
                { error: "ข้อมูลไม่ครบถ้วน (incident_id, volunteer_id, status)" },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from("assignments")
            .update({ status })
            .match({ incident_id, volunteer_id })
            .select();

        if (error) {
            console.error("Supabase update error (assignments):", error);
            return NextResponse.json(
                { error: "อัปเดตงานไม่สำเร็จ", detail: error.message },
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

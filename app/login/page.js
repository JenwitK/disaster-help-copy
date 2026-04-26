"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import "./login.css";
import { supabase } from "../lib/supabaseClient";
import Swal from "sweetalert2";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      Swal.fire({
        icon: "error",
        title: "เข้าสู่ระบบไม่สำเร็จ",
        text: "เช็คให้แน่ใจว่ารหัสผ่านหรือ Email ของท่านถูกต้อง",
        confirmButtonColor: "#ef4444",
      });
      return;
    }

    if (data.user) {
      // ตรวจสอบสถานะการอนุมัติสำหรับอาสาสมัคร
      const { data: userInfo } = await supabase
        .from("users_app")
        .select("is_approved, role")
        .eq("id", data.user.id)
        .single();

      if (userInfo && userInfo.is_approved === false) {
        await supabase.auth.signOut();
        setLoading(false);
        setError("บัญชีของคุณยังรอการอนุมัติจาก Admin กรุณารอการยืนยัน");
        Swal.fire({
          icon: "warning",
          title: "รอการอนุมัติ",
          text: "บัญชีอาสาสมัครของคุณยังไม่ได้รับการอนุมัติจาก Admin กรุณารอการยืนยัน",
          confirmButtonColor: "#ef4444",
        });
        return;
      }

      setLoading(false);
      Swal.fire({
        icon: "success",
        title: "เข้าสู่ระบบสำเร็จ",
        text: "ระบบกำลังนำท่านไปยังหน้าหลัก....",
        timer: 1500,
        timerProgressBar: true,
        showConfirmButton: false,
      }).then(() => {
        router.push("/dashboard");
      });
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-layout">
        <div className="auth-card">
          <Link href="/" className="back-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
            หน้าหลัก
          </Link>

          <div className="auth-header">
            <div className="auth-logo">
              <span className="logo-icon"></span>
            </div>
            <h1>ยินดีต้อนรับกลับมา</h1>
            <p className="auth-subtitle">เข้าสู่ระบบเพื่อใช้งาน SOS Alert</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>อีเมล</label>
              <input
                type="email"
                placeholder="example@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>รหัสผ่าน</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="รหัสผ่านของคุณ"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="toggle password"
                >
                  {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="auth-error">
                ⚠️ {error}
              </div>
            )}

            <button className="auth-btn" type="submit" disabled={loading}>
              {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </button>
          </form>

          <div className="auth-footer">
            ยังไม่มีบัญชีผู้ใช้?{" "}
            <Link href="/register">
              สมัครสมาชิก
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";
import "./register.css";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
    phone: ""
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }

    if (form.password.length < 6) {
      setError("รหัสผ่านต้องอย่างน้อย 6 ตัวอักษร");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          phone: form.phone,
          isVolunteer: form.isVolunteer // ส่งค่า checkbox ไป
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "สมัครสมาชิกไม่สำเร็จ");
        setLoading(false);
        return;
      }

      Swal.fire({
        icon: "success",
        title: "สมัครสมาชิกสำเร็จ",
        text: "โปรดล๊อกอินเพื่อเข้าใช้งาน",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#ef4444",
      }).then(() => {
        router.push("/login");
        router.refresh();
      });

    } catch (err) {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setLoading(false);
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
            <h1>สร้างบัญชีใหม่</h1>
            <p className="auth-subtitle">เข้าถึงระบบแจ้งเหตุฉุกเฉิน SOS Alert</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>ชื่อ - นามสกุล</label>
              <input
                type="text"
                name="name"
                placeholder="ตัวอย่าง : สมชาย ใจดี"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>เบอร์โทรศัพท์</label>
              <input
                type="tel"
                name="phone"
                placeholder="ตัวอย่าง : 0812345678"
                value={form.phone}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>อีเมล</label>
              <input
                type="email"
                name="email"
                placeholder="example@example.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>รหัสผ่าน</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="toggle password"
                >
                  {showPassword ? "👁️" : "🔒"}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>ยืนยันรหัสผ่าน</label>
              <div className="password-wrapper">
                <input
                  type={showConfirm ? "text" : "password"}
                  name="confirm"
                  placeholder="ยืนยันรหัสผ่านอีกครั้ง"
                  value={form.confirm}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowConfirm(!showConfirm)}
                  aria-label="toggle password"
                >
                  {showConfirm ? "👁️" : "🔒"}
                </button>
              </div>
            </div>

            <div className="form-group checkbox-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                name="isVolunteer"
                id="isVolunteer"
                checked={form.isVolunteer || false}
                onChange={(e) => setForm({ ...form, isVolunteer: e.target.checked })}
                style={{ width: 'auto', margin: 0 }}
              />
              <label htmlFor="isVolunteer" style={{ margin: 0, cursor: 'pointer', color: 'var(--text-main)' }}>
                ลงทะเบียนเป็นอาสาสมัครกู้ภัย 🚑
              </label>
            </div>

            {error && (
              <div className="auth-error">
                ⚠️ {error}
              </div>
            )}

            <button className="auth-btn" type="submit" disabled={loading}>
              {loading ? "กำลังดำเนินการ..." : "ลงทะเบียน"}
            </button>
          </form>

          <div className="auth-footer">
            มีบัญชีผู้ใช้แล้ว?{" "}
            <Link href="/login">
              เข้าสู่ระบบ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import "./dashboard.css";
import { supabase } from "../lib/supabaseClient";
import Swal from "sweetalert2";
import { Newspaper, Ambulance, Siren, ScrollText, Settings, CheckCircle, MapPin, ClipboardList, User, Clock, LocateFixed, Loader2, AlertCircle, Zap, ShieldCheck, X, Search, Shield, XCircle, ChevronRight, ImagePlus, Eye, EyeOff } from "lucide-react";

const LeafletMap = dynamic(() => import("../../components/LeafletMap"), {
    ssr: false,
});

export default function DashboardPage() {
    const [showReport, setShowReport] = useState(false);
    const [isPickingLocation, setIsPickingLocation] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [selectedPosition, setSelectedPosition] = useState(null);
    const [loading, setLoading] = useState(false);
    const [incidents, setIncidents] = useState([]);
    const [user, setUser] = useState(null);
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [selectedIncidentId, setSelectedIncidentId] = useState(null);

    const [showAllReports, setShowAllReports] = useState(false);
    const [showRescueModal, setShowRescueModal] = useState(false);
    const [rescueTab, setRescueTab] = useState('waiting');
    const [search, setSearch] = useState("");
    const [rescueSearch, setRescueSearch] = useState("");
    const [sortOrder, setSortOrder] = useState("newest");
    const [userRole, setUserRole] = useState("user");
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [loginError, setLoginError] = useState("");
    const [loginLoading, setLoginLoading] = useState(false);
    const [showLoginPw, setShowLoginPw] = useState(false);

    const [showEditModal, setShowEditModal] = useState(false);
    const [editingIncident, setEditingIncident] = useState(null);
    const [editTitle, setEditTitle] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [editPosition, setEditPosition] = useState(null);
    const [editIsPickingLocation, setEditIsPickingLocation] = useState(false);
    const [editNewFiles, setEditNewFiles] = useState([]);
    const [editNewPreviews, setEditNewPreviews] = useState([]);
    const [editDeleteMediaIds, setEditDeleteMediaIds] = useState([]);
    const [editLoading, setEditLoading] = useState(false);

    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [regForm, setRegForm] = useState({ name: "", email: "", password: "", confirm: "", phone: "", isVolunteer: false });
    const [regError, setRegError] = useState("");
    const [regLoading, setRegLoading] = useState(false);
    const [showRegPw, setShowRegPw] = useState(false);
    const [showRegConfirm, setShowRegConfirm] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [uploadingImages, setUploadingImages] = useState(false);

    const [users_app, setUsers_app] = useState({
        full_name: "",
        email: "",
        password: "",
    });

    const fetchIncidents = async () => {
        try {
            const res = await fetch('/api/incidents');
            const result = await res.json();
            if (result.success) {
                setIncidents(result.data || []);
            }
        } catch (err) {
            console.error("Fetch error:", err);
        }
    };

    useEffect(() => {
        fetchIncidents();
    }, []);

    const handleLogout = async () => {
        const result = await Swal.fire({
            html: `
              <div style="padding:8px 0 4px">
                <div style="width:68px;height:68px;background:#fef2f2;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;border:2px solid #fecaca">
                  <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                </div>
                <h2 style="font-size:1.35rem;font-weight:800;color:#1e293b;margin:0 0 10px;font-family:inherit">ออกจากระบบ?</h2>
                <p style="color:#64748b;font-size:0.9rem;margin:0;font-family:inherit;line-height:1.5">คุณต้องการออกจากระบบใช่หรือไม่</p>
              </div>
            `,
            showCancelButton: true,
            confirmButtonText: "ออกจากระบบ",
            cancelButtonText: "ยกเลิก",
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#f1f5f9",
            customClass: {
                popup: "swal-auth-popup",
                confirmButton: "swal-auth-confirm",
                cancelButton: "swal-auth-cancel",
            },
        });

        if (!result.isConfirmed) return;

        const { error } = await supabase.auth.signOut();

        if (error) {
            Swal.fire("ผิดพลาด", "ออกจากระบบไม่สำเร็จ", "error");
            return;
        }

        setUser(null);
        setUserRole("user");
    };

    const requireAuth = (callback) => {
        if (!user) {
            Swal.fire({
                html: `
                  <div style="padding:8px 0 4px">
                    <div style="width:68px;height:68px;background:#fef2f2;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;border:2px solid #fecaca">
                      <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                    </div>
                    <h2 style="font-size:1.35rem;font-weight:800;color:#1e293b;margin:0 0 10px;font-family:inherit">กรุณาเข้าสู่ระบบก่อน</h2>
                    <p style="color:#64748b;font-size:0.9rem;margin:0;font-family:inherit;line-height:1.5">คุณต้องเข้าสู่ระบบก่อน<br>จึงจะสามารถใช้งานฟีเจอร์นี้ได้</p>
                  </div>
                `,
                showCancelButton: true,
                confirmButtonText: "เข้าสู่ระบบ",
                cancelButtonText: "ยกเลิก",
                confirmButtonColor: "#ef4444",
                cancelButtonColor: "#f1f5f9",
                customClass: {
                    popup: "swal-auth-popup",
                    confirmButton: "swal-auth-confirm",
                    cancelButton: "swal-auth-cancel",
                },
            }).then((result) => {
                if (result.isConfirmed) setShowLoginModal(true);
            });
            return;
        }
        callback();
    };

    useEffect(() => {
        const initAuth = async () => {
            const { data, error } = await supabase.auth.getSession();

            if (error) {
                console.error("Get session error:", error);
                setCheckingAuth(false);
                return;
            }

            if (data.session?.user) {
                setUser(data.session.user);

                const { data: userData, error: userError } = await supabase
                    .from("users_app")
                    .select("role")
                    .eq("id", data.session.user.id)
                    .single();

                if (!userError && userData) {
                    setUserRole(userData.role || "user");
                }
            }

            setCheckingAuth(false);
        };

        initAuth();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setUser(session.user);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    if (checkingAuth) {
        return <div className="loading-screen">กำลังโหลด...</div>;
    }

    const handleSaveProfile = async () => {
        try {
            if (users_app.email || users_app.password) {
                const { data, error } = await supabase.auth.updateUser({
                    email: users_app.email || undefined,
                    password: users_app.password || undefined,
                });

                if (error) {
                    Swal.fire("ผิดพลาด", error.message, "error");
                    return;
                }
            }

            if (users_app.full_name) {
                const { error } = await supabase
                    .from("users_app")
                    .update({ full_name: users_app.full_name })
                    .eq("id", user.id);

                if (error) {
                    Swal.fire("ผิดพลาด", "อัปเดตชื่อไม่สำเร็จ", "error");
                    return;
                }
            }

            Swal.fire({
                icon: "success",
                title: "บันทึกสำเร็จ",
                confirmButtonColor: "#ef4444",
            });

            fetchIncidents();
            setShowSettings(false);
            setUsers_app({ full_name: "", email: "", password: "" });
        } catch (err) {
            console.error(err);
            Swal.fire("ผิดพลาด", "เกิดข้อผิดพลาด", "error");
        }
    };

    const visibleIncidents = userRole === 'admin'
        ? incidents
        : incidents.filter(i => i.approval_status === 'approved');

    const filteredIncidents = visibleIncidents.filter((item) => {
        const q = search.toLowerCase();
        return (
            (item.title || "").toLowerCase().includes(q) ||
            (item.description || "").toLowerCase().includes(q) ||
            (item.users_app?.full_name || "").toLowerCase().includes(q)
        );
    });

    const stats = {
        waiting: visibleIncidents.filter(i => !i.status || i.status === 'รอการช่วยเหลือ').length,
        in_progress: visibleIncidents.filter(i => i.status === 'กำลังดำเนินการ').length,
        completed: visibleIncidents.filter(i => i.status === 'ช่วยเหลือสำเร็จ').length
    };

    const rescueFilteredIncidents = visibleIncidents.filter(item => {
        const status = item.status || 'รอการช่วยเหลือ';

        let targetStatus = 'รอการช่วยเหลือ';
        if (rescueTab === 'in_progress') targetStatus = 'กำลังดำเนินการ';
        if (rescueTab === 'completed') targetStatus = 'ช่วยเหลือสำเร็จ';

        const matchesStatus = (status === targetStatus);

        if (!matchesStatus) return false;

        const q = rescueSearch.toLowerCase();
        return (
            (item.title || "").toLowerCase().includes(q) ||
            (item.description || "").toLowerCase().includes(q) ||
            (item.users_app?.full_name || "").toLowerCase().includes(q) ||
            (item.assignments?.[0]?.users_app?.full_name || "").toLowerCase().includes(q)
        );
    }).sort((a, b) => {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    const resetRegForm = () => {
        setRegForm({ name: "", email: "", password: "", confirm: "", phone: "", isVolunteer: false });
        setRegError("");
        setShowRegPw(false);
        setShowRegConfirm(false);
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setRegError("");

        if (regForm.password !== regForm.confirm) { setRegError("รหัสผ่านไม่ตรงกัน"); return; }
        if (regForm.password.length < 6) { setRegError("รหัสผ่านต้องอย่างน้อย 6 ตัวอักษร"); return; }

        setRegLoading(true);
        try {
            const res = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: regForm.name, email: regForm.email, password: regForm.password, phone: regForm.phone, isVolunteer: regForm.isVolunteer }),
            });
            const data = await res.json();

            if (!res.ok) { setRegError(data.error || "สมัครสมาชิกไม่สำเร็จ"); setRegLoading(false); return; }

            setShowRegisterModal(false);
            resetRegForm();

            if (regForm.isVolunteer) {
                Swal.fire({
                    html: `<div style="padding:8px 0 4px"><div style="width:68px;height:68px;background:#fef3c7;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;border:2px solid #fde68a"><svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div><h2 style="font-size:1.2rem;font-weight:800;color:#1e293b;margin:0 0 10px;font-family:inherit">สมัครสำเร็จ!</h2><p style="color:#64748b;font-size:0.875rem;margin:0;font-family:inherit;line-height:1.6">บัญชีอาสาสมัครของคุณถูกสร้างแล้ว<br/>กรุณารอการอนุมัติจาก Admin ก่อนเข้าสู่ระบบ</p></div>`,
                    confirmButtonText: "ตกลง",
                    confirmButtonColor: "#ef4444",
                    customClass: { popup: "swal-auth-popup", confirmButton: "swal-auth-confirm" },
                });
            } else {
                Swal.fire({
                    html: `<div style="padding:8px 0 4px"><div style="width:68px;height:68px;background:#dcfce7;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;border:2px solid #bbf7d0"><svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div><h2 style="font-size:1.2rem;font-weight:800;color:#1e293b;margin:0 0 10px;font-family:inherit">สมัครสำเร็จ!</h2><p style="color:#64748b;font-size:0.875rem;margin:0;font-family:inherit">เข้าสู่ระบบเพื่อเริ่มใช้งานได้เลย</p></div>`,
                    confirmButtonText: "เข้าสู่ระบบ",
                    confirmButtonColor: "#ef4444",
                    customClass: { popup: "swal-auth-popup", confirmButton: "swal-auth-confirm" },
                }).then(() => setShowLoginModal(true));
            }
        } catch (err) {
            setRegError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
        } finally {
            setRegLoading(false);
        }
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setLoginError("");
        setLoginLoading(true);

        const { data, error } = await supabase.auth.signInWithPassword({
            email: loginEmail,
            password: loginPassword,
        });

        if (error) {
            setLoginError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
            setLoginLoading(false);
            return;
        }

        const { data: userInfo } = await supabase
            .from("users_app")
            .select("is_approved, role")
            .eq("id", data.user.id)
            .single();

        if (userInfo?.is_approved === false) {
            await supabase.auth.signOut();
            setLoginError("บัญชีของคุณยังรอการอนุมัติจาก Admin");
            setLoginLoading(false);
            return;
        }

        setUser(data.user);
        setUserRole(userInfo?.role || "user");
        setShowLoginModal(false);
        setLoginEmail("");
        setLoginPassword("");
        setLoginLoading(false);
        fetchIncidents();
    };

    const handleCancelIncident = async (item) => {
        const result = await Swal.fire({
            html: `<div style="padding:8px 0 4px"><div style="width:64px;height:64px;background:#fef2f2;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 18px;border:2px solid #fecaca"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg></div><h2 style="font-size:1.2rem;font-weight:800;color:#1e293b;margin:0 0 8px;font-family:inherit">ยกเลิกการแจ้งเหตุ?</h2><p style="color:#64748b;font-size:0.875rem;margin:0;font-family:inherit">การแจ้งเหตุ <b style="color:#1e293b">${item.title}</b> จะถูกลบออก</p></div>`,
            showCancelButton: true,
            confirmButtonText: "ยกเลิกการแจ้งเหตุ",
            cancelButtonText: "ไม่ยกเลิก",
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#f1f5f9",
            customClass: { popup: "swal-auth-popup", confirmButton: "swal-auth-confirm", cancelButton: "swal-auth-cancel" },
        });
        if (!result.isConfirmed) return;

        const res = await fetch("/api/incidents", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: item.id }),
        });
        if (res.ok) {
            Swal.fire({ icon: "success", title: "ยกเลิกแล้ว", timer: 1200, showConfirmButton: false });
            fetchIncidents();
        }
    };

    const handleOpenEdit = (item) => {
        setEditingIncident(item);
        setEditTitle(item.title);
        setEditDescription(item.description || "");
        setEditPosition({ lat: Number(item.lat), lng: Number(item.lng) });
        setEditDeleteMediaIds([]);
        setEditNewFiles([]);
        setEditNewPreviews([]);
        setShowEditModal(true);
    };

    const handleEditAddFiles = (e) => {
        const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/')).filter(f => f.size <= 10 * 1024 * 1024);
        const remaining = 5 - (editingIncident?.incident_media?.filter(m => !editDeleteMediaIds.includes(m.id)).length || 0) - editNewFiles.length;
        const valid = files.slice(0, remaining);
        setEditNewFiles(prev => [...prev, ...valid]);
        setEditNewPreviews(prev => [...prev, ...valid.map(f => URL.createObjectURL(f))]);
        e.target.value = '';
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!editingIncident) return;
        setEditLoading(true);
        try {
            const res = await fetch("/api/incidents", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: editingIncident.id,
                    title: editTitle,
                    description: editDescription,
                    lat: editPosition?.lat,
                    lng: editPosition?.lng,
                    deleteMediaIds: editDeleteMediaIds,
                }),
            });
            if (!res.ok) throw new Error();

            if (editNewFiles.length > 0) {
                await uploadImages(editingIncident.id, editNewFiles);
            }

            editNewPreviews.forEach(url => URL.revokeObjectURL(url));
            setShowEditModal(false);
            setEditingIncident(null);
            await fetchIncidents();
            Swal.fire({ icon: "success", title: "แก้ไขสำเร็จ", timer: 1500, showConfirmButton: false });
        } catch {
            Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด", text: "กรุณาลองใหม่", confirmButtonColor: "#ef4444" });
        } finally {
            setEditLoading(false);
        }
    };

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            Swal.fire({
                icon: "error",
                title: "ไม่รองรับ GPS",
                text: "เบราว์เซอร์ของคุณไม่รองรับการระบุตำแหน่ง",
                confirmButtonColor: "#ef4444",
            });
            return;
        }

        setIsGettingLocation(true);

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;

                if (lat < 5.6 || lat > 20.5 || lng < 97.3 || lng > 105.7) {
                    setIsGettingLocation(false);
                    Swal.fire({
                        icon: "warning",
                        title: "ตำแหน่งอยู่นอกประเทศไทย",
                        text: "ระบบรองรับเฉพาะพิกัดในประเทศไทยเท่านั้น",
                        confirmButtonColor: "#ef4444",
                    });
                    return;
                }

                setSelectedPosition({ lat, lng });
                setIsGettingLocation(false);
            },
            (err) => {
                setIsGettingLocation(false);
                let msg = "ไม่สามารถระบุตำแหน่งได้";
                if (err.code === err.PERMISSION_DENIED)
                    msg = "กรุณาอนุญาตการเข้าถึงตำแหน่งที่ตั้งในเบราว์เซอร์ก่อน";
                else if (err.code === err.POSITION_UNAVAILABLE)
                    msg = "ไม่สามารถระบุตำแหน่งได้ในขณะนี้ กรุณาลองใหม่";
                else if (err.code === err.TIMEOUT)
                    msg = "หมดเวลาการค้นหาตำแหน่ง กรุณาลองใหม่อีกครั้ง";

                Swal.fire({
                    icon: "error",
                    title: "ระบุตำแหน่งไม่สำเร็จ",
                    text: msg,
                    confirmButtonColor: "#ef4444",
                });
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        const remaining = 5 - selectedFiles.length;
        if (remaining <= 0) return;

        const valid = files
            .filter(f => f.type.startsWith('image/'))
            .filter(f => f.size <= 10 * 1024 * 1024)
            .slice(0, remaining);

        if (valid.length < files.length) {
            Swal.fire({ icon: 'warning', title: 'บางไฟล์ถูกข้ามไป', text: 'รองรับเฉพาะรูปภาพขนาดไม่เกิน 10MB', confirmButtonColor: '#ef4444' });
        }

        const previews = valid.map(f => URL.createObjectURL(f));
        setSelectedFiles(prev => [...prev, ...valid]);
        setImagePreviews(prev => [...prev, ...previews]);
        e.target.value = '';
    };

    const handleRemoveImage = (index) => {
        URL.revokeObjectURL(imagePreviews[index]);
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const uploadImages = async (incidentId, files) => {
        for (const file of files) {
            try {
                const ext = file.name.split('.').pop();
                const path = `${incidentId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

                const { error: upErr } = await supabase.storage
                    .from('incident-media')
                    .upload(path, file, { contentType: file.type, upsert: false });

                if (upErr) { console.error('Upload error:', upErr); continue; }

                const { data: urlData } = supabase.storage
                    .from('incident-media')
                    .getPublicUrl(path);

                await supabase.from('incident_media').insert({
                    incident_id: incidentId,
                    file_url: urlData.publicUrl,
                });
            } catch (err) {
                console.error('Image upload failed:', err);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!title || !selectedPosition) {
            Swal.fire({
                icon: "warning",
                title: "กรุณาใส่ข้อมูลให้ครบถ้วน",
                text: "คุณยังไม่ได้เลือกพิกัดหรือใส่หัวข้อ",
                confirmButtonColor: "#ef4444",
            });
            return;
        }

        if (!user) {
            requireAuth(() => {});
            return;
        }

        try {
            setLoading(true);

            const res = await fetch("/api/incidents", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: user.id,
                    title,
                    description,
                    lat: selectedPosition.lat,
                    lng: selectedPosition.lng,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                Swal.fire({ icon: "error", title: "บันทึกไม่สำเร็จ", text: data.error || "กรุณาลองใหม่อีกครั้ง", confirmButtonColor: "#ef4444" });
                return;
            }

            const incidentId = data.data?.[0]?.id;
            if (selectedFiles.length > 0 && incidentId) {
                setUploadingImages(true);
                await uploadImages(incidentId, selectedFiles);
                setUploadingImages(false);
            }

            Swal.fire({
                icon: "success",
                title: "แจ้งเหตุสำเร็จ!",
                text: "รอแอดมินอนุมัติก่อนจึงจะแสดงบนแผนที่",
                timer: 2500,
                showConfirmButton: false,
            });

            await fetchIncidents();

            setTitle("");
            setDescription("");
            setSelectedPosition(null);
            setShowReport(false);
            imagePreviews.forEach(url => URL.revokeObjectURL(url));
            setSelectedFiles([]);
            setImagePreviews([]);
        } catch (err) {
            console.error(err);
            Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด", text: "กรุณาลองใหม่อีกครั้ง", confirmButtonColor: "#ef4444" });
        } finally {
            setLoading(false);
        }
    };

    const handleSelectPosition = (pos) => {
        if (editIsPickingLocation) {
            setEditPosition(pos);
            setEditIsPickingLocation(false);
            setShowEditModal(true);
        } else {
            setSelectedPosition(pos);
            setIsPickingLocation(false);
            setShowReport(true);
        }
    };

    const handleClickIncident = (item) => {
        if (!item.lat || !item.lng) return;

        if (selectedIncidentId === item.id) {
            setSelectedIncidentId(null);
            setSelectedPosition(null);
            return;
        }

        setSelectedIncidentId(item.id);
        setSelectedPosition({ lat: Number(item.lat), lng: Number(item.lng) });
    };

    const handleAcceptCase = async (item) => {
        if (!user) return;

        try {
            const resIncident = await fetch('/api/incidents', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: item.id, status: 'กำลังดำเนินการ' })
            });

            if (!resIncident.ok) throw new Error('Failed to update incident status');
            const resAssignment = await fetch('/api/assignments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    incident_id: item.id,
                    volunteer_id: user.id,
                    status: 'accepted'
                })
            });

            if (!resAssignment.ok) throw new Error('Failed to create assignment');

            Swal.fire({
                icon: 'success',
                title: 'รับเคสสำเร็จ!',
                text: 'คุณได้รับมอบหมายงานนี้แล้ว',
                timer: 1500,
                showConfirmButton: false
            });

            fetchIncidents();
        } catch (err) {
            console.error(err);
            Swal.fire('Error', 'เกิดข้อผิดพลาดในการรับเคส', 'error');
        }
    };

    const handleCompleteCase = async (item) => {
        if (!user) return;

        try {
            const resIncident = await fetch('/api/incidents', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: item.id, status: 'ช่วยเหลือสำเร็จ' })
            });

            if (!resIncident.ok) throw new Error('Failed to update incident status');
            const resAssignment = await fetch('/api/assignments', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    incident_id: item.id,
                    volunteer_id: user.id,
                    status: 'success'
                })
            });

            if (!resAssignment.ok) {
                console.warn('Assignment PATCH failed, continuing anyway');
            }

            await fetchIncidents();
            setRescueTab('completed');

            Swal.fire({
                icon: 'success',
                title: 'ปิดงานสำเร็จ!',
                text: 'ขอบคุณสำหรับการช่วยเหลือ',
                timer: 1500,
                showConfirmButton: false
            });
        } catch (err) {
            console.error(err);
            await fetchIncidents();
            Swal.fire('Error', 'เกิดข้อผิดพลาดในการปิดงาน', 'error');
        }
    };

    return (
        <div className="dashboard-root">
            <div className="topbar">
                <div className="logo">
                    <span className="logo-icon"></span>
                    SOS Command
                </div>

                <div className="topbar-right">
                    {user ? (
                        <>
                            {userRole === "admin" && (
                                <button className="admin-panel-btn" onClick={() => window.location.href = '/admin'}>
                                    Admin Panel
                                </button>
                            )}
                            {userRole === "volunteer" && (
                                <button className="rescue-view-btn" onClick={() => setShowRescueModal(true)}>
                                    มุมมองสำหรับกู้ภัย
                                </button>
                            )}
                            <div className="user">{user.email}</div>
                            <button className="logout-btn" onClick={handleLogout}>ออก</button>
                        </>
                    ) : (
                        <>
                            <button className="topbar-register-btn" onClick={() => setShowRegisterModal(true)}>สมัครสมาชิก</button>
                            <button className="topbar-login-btn" onClick={() => setShowLoginModal(true)}>เข้าสู่ระบบ</button>
                        </>
                    )}
                </div>
            </div>

            <div className="main-area">
                <LeafletMap
                    initialPosition={selectedPosition}
                    onSelectLocation={handleSelectPosition}
                    incidents={visibleIncidents.filter(i => i.status !== 'ช่วยเหลือสำเร็จ')}
                    selectedIncidentId={selectedIncidentId}
                />
            </div>

            <div className="bottom-panel">
                <div className="incident-list">
                    {visibleIncidents.filter(i => i.status !== 'ช่วยเหลือสำเร็จ').slice(0, 5).map((item) => (
                        <div
                            key={item.id}
                            className="incident-item"
                            onClick={() => handleClickIncident(item)}
                        >
                            <h3>{item.title}</h3>
                            <div className="report-desc">
                                {item.description || "ไม่มีรายละเอียด"}
                            </div>
                            <div className="report-meta">
                                <span>{item.users_app?.full_name || "ไม่ทราบชื่อ"}</span>
                            </div>
                        </div>
                    ))}
                    {visibleIncidents.filter(i => i.status !== 'ช่วยเหลือสำเร็จ').length === 0 && (
                        <div className="incident-item incident-item-empty">
                            <h3>ยังไม่มีเหตุฉุกเฉิน</h3>
                        </div>
                    )}
                </div>
            </div>

            <div className="bottom-nav">
                <button className="nav-btn" onClick={() => setShowAllReports(true)}>
                    <div className="icon"><Newspaper size={22} /></div>
                    <span>ข่าวสาร</span>
                </button>

                <button
                    className="nav-btn"
                    onClick={() => requireAuth(() => Swal.fire({
                        icon: "info",
                        title: "เรียกกู้ภัย",
                        text: "ฟีเจอร์นี้อยู่ระหว่างการพัฒนา.",
                        confirmButtonText: "ตกลง",
                        confirmButtonColor: "#ef4444"
                    }))}
                >
                    <div className="icon"><Ambulance size={22} /></div>
                    <span>กู้ภัย</span>
                </button>

                <button
                    className="nav-btn sos-btn"
                    onClick={() => requireAuth(() => {
                        setShowReport(true);
                        setIsPickingLocation(false);
                    })}
                >
                    <div className="icon"><Siren size={22} /></div>
                    <span>แจ้งเหตุ</span>
                </button>

                <button className="nav-btn" onClick={() => requireAuth(() => setShowHistory(true))}>
                    <div className="icon"><ScrollText size={22} /></div>
                    <span>ประวัติ</span>
                </button>

                <button className="nav-btn" onClick={() => requireAuth(() => setShowSettings(true))}>
                    <div className="icon"><Settings size={22} /></div>
                    <span>ตั้งค่า</span>
                </button>
            </div>

            {showReport && !isPickingLocation && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h2><Siren size={22} className="inline-icon" /> แจ้งเหตุฉุกเฉิน</h2>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>หัวข้อเหตุการณ์</label>
                                <input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="เช่น อุบัติเหตุ, ไฟไหม้"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>รายละเอียด</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="รายละเอียดเพิ่มเติม..."
                                />
                            </div>

                            <div className="form-group">
                                <label>พิกัด</label>
                                {selectedPosition ? (
                                    <div className="coords-selected">
                                        <CheckCircle size={16} color="#22c55e" />
                                        <span>เลือกจุดแล้ว ({selectedPosition.lat.toFixed(5)}, {selectedPosition.lng.toFixed(5)})</span>
                                        <button
                                            type="button"
                                            className="coords-change-btn"
                                            onClick={() => setSelectedPosition(null)}
                                        >
                                            เปลี่ยน
                                        </button>
                                    </div>
                                ) : (
                                    <div className="location-options">
                                        <div
                                            className="coords-box"
                                            onClick={() => {
                                                setShowReport(false);
                                                setIsPickingLocation(true);
                                            }}
                                        >
                                            <MapPin size={16} className="inline-icon" /> แตะเพื่อเลือกจุดบนแผนที่
                                        </div>
                                        <button
                                            type="button"
                                            className="current-location-btn"
                                            onClick={handleGetCurrentLocation}
                                            disabled={isGettingLocation}
                                        >
                                            {isGettingLocation ? (
                                                <><Loader2 size={16} className="spin" /> กำลังระบุตำแหน่ง...</>
                                            ) : (
                                                <><LocateFixed size={16} /> เลือกตำแหน่งที่ตั้งปัจจุบัน</>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label>
                                    รูปภาพ
                                    <span className="label-optional"> (ไม่บังคับ · สูงสุด 5 รูป)</span>
                                </label>

                                {imagePreviews.length > 0 && (
                                    <div className="image-previews">
                                        {imagePreviews.map((url, i) => (
                                            <div key={i} className="image-preview-item">
                                                <img src={url} alt="" />
                                                <button
                                                    type="button"
                                                    className="image-remove-btn"
                                                    onClick={() => handleRemoveImage(i)}
                                                >
                                                    <X size={11} />
                                                </button>
                                            </div>
                                        ))}
                                        {imagePreviews.length < 5 && (
                                            <label className="image-add-more">
                                                <input type="file" accept="image/*" multiple onChange={handleFileSelect} style={{ display: 'none' }} />
                                                <ImagePlus size={20} />
                                            </label>
                                        )}
                                    </div>
                                )}

                                {imagePreviews.length === 0 && (
                                    <label className="image-upload-area">
                                        <input type="file" accept="image/*" multiple onChange={handleFileSelect} style={{ display: 'none' }} />
                                        <ImagePlus size={22} />
                                        <span>แตะเพื่อเลือกรูปภาพ</span>
                                        <small>JPG, PNG · ไม่เกิน 10MB ต่อรูป</small>
                                    </label>
                                )}
                            </div>

                            <div className="form-actions">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowReport(false);
                                        setSelectedPosition(null);
                                        setTitle("");
                                        setDescription("");
                                        imagePreviews.forEach(url => URL.revokeObjectURL(url));
                                        setSelectedFiles([]);
                                        setImagePreviews([]);
                                    }}
                                >
                                    ยกเลิก
                                </button>
                                <button type="submit" disabled={loading || uploadingImages}>
                                    {uploadingImages ? (
                                        <><Loader2 size={15} className="spin" /> กำลังอัปโหลดรูป...</>
                                    ) : loading ? "กำลังส่ง..." : "ส่งแจ้งเหตุ"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {(isPickingLocation || editIsPickingLocation) && (
                <div className="picking-location-tip">
                    <MapPin size={16} /> แตะบนแผนที่เพื่อระบุจุดเกิดเหตุ
                </div>
            )}

            {showSettings && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h2>⚙️ ตั้งค่าบัญชี</h2>

                        <div className="form-group">
                            <label>ชื่อ - นามสกุล</label>
                            <input
                                value={users_app.full_name}
                                onChange={(e) =>
                                    setUsers_app({ ...users_app, full_name: e.target.value })
                                }
                                placeholder="ชื่อ นามสกุล"
                            />
                        </div>

                        <div className="form-group">
                            <label>Email</label>
                            <input
                                value={users_app.email}
                                onChange={(e) =>
                                    setUsers_app({ ...users_app, email: e.target.value })
                                }
                                placeholder="email"
                            />
                        </div>

                        <div className="form-group">
                            <label>เปลี่ยนรหัสผ่าน</label>
                            <input
                                type="password"
                                value={users_app.password}
                                onChange={(e) =>
                                    setUsers_app({ ...users_app, password: e.target.value })
                                }
                                placeholder="กรอกเฉพาะเมื่อต้องการเปลี่ยน"
                            />
                        </div>

                        <div className="form-actions">
                            <button onClick={() => setShowSettings(false)}>ปิด</button>
                            <button onClick={handleSaveProfile}>บันทึก</button>
                        </div>
                    </div>
                </div>
            )}

            {showAllReports && (
                <div className="modal-overlay">
                    <div className="modal modal-scroll modal-reports">

                        <div className="reports-modal-header">
                            <div className="reports-modal-title">
                                <ClipboardList size={20} />
                                <span>เหตุฉุกเฉินทั้งหมด</span>
                                <span className="reports-count">{visibleIncidents.length}</span>
                            </div>
                            <button className="rescue-close-btn" onClick={() => setShowAllReports(false)}>
                                <X size={18} />
                            </button>
                        </div>

                        <div className="reports-search-wrap">
                            <Search size={15} className="rescue-search-icon" />
                            <input
                                className="incident-search rescue-search-input reports-search"
                                type="text"
                                placeholder="ค้นหาชื่อเหตุการณ์ / ผู้แจ้ง / รายละเอียด..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        {visibleIncidents.length === 0 ? (
                            <div className="reports-empty">
                                <Siren size={36} strokeWidth={1.2} />
                                <p>ยังไม่มีเหตุฉุกเฉิน</p>
                            </div>
                        ) : (
                            <div className="all-reports-list">
                                {filteredIncidents.length === 0 ? (
                                    <div className="reports-empty">
                                        <Search size={32} strokeWidth={1.2} />
                                        <p>ไม่พบข้อมูลที่ค้นหา</p>
                                    </div>
                                ) : (
                                    filteredIncidents.map((item) => {
                                        const statusKey = item.status === 'กำลังดำเนินการ' ? 'inprogress' : item.status === 'ช่วยเหลือสำเร็จ' ? 'done' : 'waiting';
                                        return (
                                            <div key={item.id} className={`report-card report-card-${statusKey}`}>
                                                <div className="report-card-top">
                                                    <div className="report-title">
                                                        <Siren size={15} />
                                                        {item.title}
                                                    </div>
                                                    <span className={`rescue-badge rescue-badge-${statusKey}`}>
                                                        {item.status || 'รอการช่วยเหลือ'}
                                                    </span>
                                                </div>
                                                {item.description && (
                                                    <div className="report-desc">{item.description}</div>
                                                )}
                                                <div className="report-footer">
                                                    <span className="report-meta-item">
                                                        <User size={12} /> {item.users_app?.full_name || "ไม่ทราบ"}
                                                    </span>
                                                    <span className="report-meta-item">
                                                        <Clock size={12} /> {new Date(item.created_at).toLocaleDateString('th-TH')}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showHistory && (() => {
                const userIncidents = [...incidents]
                    .filter(i => i.user_id === user?.id || i.users_app?.id === user?.id)
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

                const getStatusInfo = (item) => {
                    if (item.approval_status === 'rejected')
                        return { label: 'ถูกปฏิเสธ', colorKey: 'rejected', Icon: XCircle };
                    if (!item.approval_status || item.approval_status === 'pending')
                        return { label: 'รอแอดมินอนุมัติ', colorKey: 'pending', Icon: Clock };
                    if (item.status === 'ช่วยเหลือสำเร็จ')
                        return { label: 'ช่วยเหลือสำเร็จ', colorKey: 'done', Icon: ShieldCheck };
                    if (item.status === 'กำลังดำเนินการ')
                        return { label: 'กำลังดำเนินการ', colorKey: 'inprogress', Icon: Zap };
                    return { label: 'รอการช่วยเหลือ', colorKey: 'waiting', Icon: AlertCircle };
                };

                return (
                    <div className="modal-overlay">
                        <div className="modal modal-scroll modal-history">

                            <div className="history-header">
                                <div className="history-header-title">
                                    <ScrollText size={20} />
                                    <span>ประวัติการแจ้งเหตุของฉัน</span>
                                    <span className="reports-count">{userIncidents.length}</span>
                                </div>
                                <button className="rescue-close-btn" onClick={() => setShowHistory(false)}>
                                    <X size={18} />
                                </button>
                            </div>

                            {userIncidents.length === 0 ? (
                                <div className="history-empty">
                                    <ScrollText size={44} strokeWidth={1} />
                                    <p>คุณยังไม่เคยแจ้งเหตุ</p>
                                    <button
                                        className="history-report-btn"
                                        onClick={() => { setShowHistory(false); setShowReport(true); }}
                                    >
                                        <Siren size={15} /> แจ้งเหตุเลย
                                    </button>
                                </div>
                            ) : (
                                <div className="history-list">
                                    {userIncidents.map((item) => {
                                        const { label, colorKey, Icon } = getStatusInfo(item);
                                        return (
                                            <div key={item.id} className={`history-card history-card-${colorKey}`}>
                                                <div className="history-card-header">
                                                    <div className="history-card-title">
                                                        <Siren size={15} className="history-siren" />
                                                        <span>{item.title}</span>
                                                    </div>
                                                    <span className={`history-badge history-badge-${colorKey}`}>
                                                        <Icon size={11} />
                                                        {label}
                                                    </span>
                                                </div>

                                                {item.description && (
                                                    <p className="history-desc">{item.description}</p>
                                                )}

                                                <div className="history-meta">
                                                    <span><MapPin size={12} /> {Number(item.lat).toFixed(4)}, {Number(item.lng).toFixed(4)}</span>
                                                    <span><Clock size={12} /> {new Date(item.created_at).toLocaleString('th-TH')}</span>
                                                </div>

                                                <div className="history-actions">
                                                    {(item.approval_status === 'pending' || (!item.approval_status) ||
                                                        (item.approval_status === 'approved' && item.status === 'รอการช่วยเหลือ')) && (
                                                        <button
                                                            className="history-edit-btn"
                                                            onClick={() => handleOpenEdit(item)}
                                                        >
                                                            <Settings size={13} /> แก้ไข
                                                        </button>
                                                    )}
                                                    {(item.approval_status === 'pending' || !item.approval_status) && (
                                                        <button
                                                            className="history-cancel-btn"
                                                            onClick={() => handleCancelIncident(item)}
                                                        >
                                                            <X size={13} /> ยกเลิก
                                                        </button>
                                                    )}
                                                </div>

                                                {item.approval_status === 'approved' && item.status !== 'ช่วยเหลือสำเร็จ' && (
                                                    <button
                                                        className="history-map-btn"
                                                        onClick={() => {
                                                            handleClickIncident(item);
                                                            setShowHistory(false);
                                                        }}
                                                    >
                                                        <MapPin size={13} /> ดูบนแผนที่ <ChevronRight size={13} />
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })()}

            {showEditModal && editingIncident && (
                <div className="modal-overlay">
                    <div className="modal modal-scroll modal-edit">
                        <div className="login-modal-header">
                            <div className="login-modal-logo">
                                <Settings size={18} />
                                <span>แก้ไขการแจ้งเหตุ</span>
                            </div>
                            <button className="rescue-close-btn" onClick={() => { setShowEditModal(false); editNewPreviews.forEach(u => URL.revokeObjectURL(u)); }}>
                                <X size={18} />
                            </button>
                        </div>

                        <div className="login-modal-body">
                            <form onSubmit={handleEditSubmit}>
                                <div className="form-group">
                                    <label>หัวข้อเหตุการณ์</label>
                                    <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />
                                </div>

                                <div className="form-group">
                                    <label>รายละเอียด</label>
                                    <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} style={{ resize: 'vertical' }} />
                                </div>

                                <div className="form-group">
                                    <label>พิกัด</label>
                                    <div className="coords-selected">
                                        <CheckCircle size={15} color="#22c55e" />
                                        <span>{editPosition?.lat.toFixed(5)}, {editPosition?.lng.toFixed(5)}</span>
                                        <button type="button" className="coords-change-btn" onClick={() => { setShowEditModal(false); setEditIsPickingLocation(true); }}>
                                            เปลี่ยน
                                        </button>
                                    </div>
                                </div>

                                {(editingIncident.incident_media?.length > 0 || editNewFiles.length > 0) && (
                                    <div className="form-group">
                                        <label>รูปภาพ</label>
                                        <div className="image-previews">
                                            {editingIncident.incident_media
                                                ?.filter(m => !editDeleteMediaIds.includes(m.id))
                                                .map(m => (
                                                    <div key={m.id} className="image-preview-item">
                                                        <img src={m.file_url} alt="" />
                                                        <button type="button" className="image-remove-btn"
                                                            onClick={() => setEditDeleteMediaIds(prev => [...prev, m.id])}>
                                                            <X size={11} />
                                                        </button>
                                                    </div>
                                                ))}
                                            {editNewPreviews.map((url, i) => (
                                                <div key={`new-${i}`} className="image-preview-item">
                                                    <img src={url} alt="" />
                                                    <button type="button" className="image-remove-btn"
                                                        onClick={() => {
                                                            URL.revokeObjectURL(url);
                                                            setEditNewFiles(prev => prev.filter((_, idx) => idx !== i));
                                                            setEditNewPreviews(prev => prev.filter((_, idx) => idx !== i));
                                                        }}>
                                                        <X size={11} />
                                                    </button>
                                                </div>
                                            ))}
                                            {(editingIncident.incident_media?.filter(m => !editDeleteMediaIds.includes(m.id)).length || 0) + editNewFiles.length < 5 && (
                                                <label className="image-add-more">
                                                    <input type="file" accept="image/*" multiple onChange={handleEditAddFiles} style={{ display: 'none' }} />
                                                    <ImagePlus size={20} />
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {!editingIncident.incident_media?.length && editNewFiles.length === 0 && (
                                    <div className="form-group">
                                        <label>รูปภาพ</label>
                                        <label className="image-upload-area">
                                            <input type="file" accept="image/*" multiple onChange={handleEditAddFiles} style={{ display: 'none' }} />
                                            <ImagePlus size={20} />
                                            <span>แตะเพื่อเพิ่มรูปภาพ</span>
                                        </label>
                                    </div>
                                )}

                                <div className="form-actions">
                                    <button type="button" onClick={() => { setShowEditModal(false); editNewPreviews.forEach(u => URL.revokeObjectURL(u)); }}>ยกเลิก</button>
                                    <button type="submit" disabled={editLoading}>
                                        {editLoading ? <><Loader2 size={15} className="spin" /> กำลังบันทึก...</> : "บันทึก"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {showLoginModal && (
                <div className="modal-overlay" onClick={() => { setShowLoginModal(false); setLoginError(""); }}>
                    <div className="modal modal-login" onClick={(e) => e.stopPropagation()}>
                        <div className="login-modal-header">
                            <div className="login-modal-logo">
                                <span className="logo-icon"></span>
                                SOS Alert
                            </div>
                            <button className="rescue-close-btn" onClick={() => { setShowLoginModal(false); setLoginError(""); }}>
                                <X size={18} />
                            </button>
                        </div>

                        <div className="login-modal-body">
                            <h2>ยินดีต้อนรับกลับมา</h2>
                            <p className="login-modal-sub">เข้าสู่ระบบเพื่อใช้งาน SOS Alert</p>

                            <form onSubmit={handleLoginSubmit}>
                                <div className="form-group">
                                    <label>อีเมล</label>
                                    <input
                                        type="email"
                                        placeholder="example@gmail.com"
                                        value={loginEmail}
                                        onChange={(e) => setLoginEmail(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                </div>

                                <div className="form-group">
                                    <label>รหัสผ่าน</label>
                                    <div className="password-wrapper">
                                        <input
                                            type={showLoginPw ? "text" : "password"}
                                            placeholder="รหัสผ่านของคุณ"
                                            value={loginPassword}
                                            onChange={(e) => setLoginPassword(e.target.value)}
                                            required
                                        />
                                        <button type="button" className="eye-btn" onClick={() => setShowLoginPw(!showLoginPw)}>
                                            {showLoginPw ? <Eye size={18} /> : <EyeOff size={18} />}
                                        </button>
                                    </div>
                                </div>

                                {loginError && (
                                    <div className="login-modal-error">
                                        <AlertCircle size={15} /> {loginError}
                                    </div>
                                )}

                                <button type="submit" className="login-modal-btn" disabled={loginLoading}>
                                    {loginLoading ? <><Loader2 size={16} className="spin" /> กำลังเข้าสู่ระบบ...</> : "เข้าสู่ระบบ"}
                                </button>
                            </form>

                            <div className="login-modal-footer">
                                ยังไม่มีบัญชี?{" "}
                                <button style={{background:"none",border:"none",color:"var(--primary)",fontWeight:700,cursor:"pointer",padding:0,fontFamily:"inherit",fontSize:"inherit"}}
                                    onClick={() => { setShowLoginModal(false); setLoginError(""); setShowRegisterModal(true); }}>
                                    สมัครสมาชิก
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showRegisterModal && (
                <div className="modal-overlay" onClick={() => { setShowRegisterModal(false); resetRegForm(); }}>
                    <div className="modal modal-login modal-register" onClick={(e) => e.stopPropagation()}>
                        <div className="login-modal-header">
                            <div className="login-modal-logo">
                                <span className="logo-icon"></span>
                                SOS Alert
                            </div>
                            <button className="rescue-close-btn" onClick={() => { setShowRegisterModal(false); resetRegForm(); }}>
                                <X size={18} />
                            </button>
                        </div>

                        <div className="login-modal-body register-modal-body">
                            <h2>สร้างบัญชีใหม่</h2>
                            <p className="login-modal-sub">เข้าถึงระบบแจ้งเหตุฉุกเฉิน SOS Alert</p>

                            <form onSubmit={handleRegisterSubmit}>
                                <div className="reg-row">
                                    <div className="form-group">
                                        <label>ชื่อ - นามสกุล</label>
                                        <input type="text" placeholder="สมชาย ใจดี" value={regForm.name}
                                            onChange={(e) => setRegForm({ ...regForm, name: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label>เบอร์โทรศัพท์</label>
                                        <input type="tel" placeholder="0812345678" value={regForm.phone}
                                            onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })} required />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>อีเมล</label>
                                    <input type="email" placeholder="example@example.com" value={regForm.email}
                                        onChange={(e) => setRegForm({ ...regForm, email: e.target.value })} required />
                                </div>

                                <div className="reg-row">
                                    <div className="form-group">
                                        <label>รหัสผ่าน</label>
                                        <div className="password-wrapper">
                                            <input type={showRegPw ? "text" : "password"} placeholder="อย่างน้อย 6 ตัว"
                                                value={regForm.password} onChange={(e) => setRegForm({ ...regForm, password: e.target.value })} required />
                                            <button type="button" className="eye-btn" onClick={() => setShowRegPw(!showRegPw)}>
                                                {showRegPw ? <Eye size={16} /> : <EyeOff size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>ยืนยันรหัสผ่าน</label>
                                        <div className="password-wrapper">
                                            <input type={showRegConfirm ? "text" : "password"} placeholder="ยืนยันอีกครั้ง"
                                                value={regForm.confirm} onChange={(e) => setRegForm({ ...regForm, confirm: e.target.value })} required />
                                            <button type="button" className="eye-btn" onClick={() => setShowRegConfirm(!showRegConfirm)}>
                                                {showRegConfirm ? <Eye size={16} /> : <EyeOff size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <label className="reg-volunteer-row">
                                    <input type="checkbox" checked={regForm.isVolunteer}
                                        onChange={(e) => setRegForm({ ...regForm, isVolunteer: e.target.checked })} />
                                    <span>ลงทะเบียนเป็นอาสาสมัครกู้ภัย <Ambulance size={15} style={{ display: "inline", verticalAlign: "middle" }} /></span>
                                </label>
                                {regForm.isVolunteer && (
                                    <p className="reg-volunteer-note">ต้องรอ Admin อนุมัติก่อนจึงจะ login ได้</p>
                                )}

                                {regError && (
                                    <div className="login-modal-error">
                                        <AlertCircle size={15} /> {regError}
                                    </div>
                                )}

                                <button type="submit" className="login-modal-btn" disabled={regLoading}>
                                    {regLoading ? <><Loader2 size={16} className="spin" /> กำลังสมัคร...</> : "ลงทะเบียน"}
                                </button>
                            </form>

                            <div className="login-modal-footer">
                                มีบัญชีแล้ว?{" "}
                                <button style={{ background: "none", border: "none", color: "var(--primary)", fontWeight: 700, cursor: "pointer", padding: 0, fontFamily: "inherit", fontSize: "inherit" }}
                                    onClick={() => { setShowRegisterModal(false); resetRegForm(); setShowLoginModal(true); }}>
                                    เข้าสู่ระบบ
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showRescueModal && (
                <div className="modal-overlay">
                    <div className="modal modal-xl modal-rescue">

                        <div className="rescue-modal-header">
                            <div className="rescue-modal-title">
                                <Shield size={20} />
                                <span>ศูนย์บัญชาการกู้ภัย</span>
                            </div>
                            <button className="rescue-close-btn" onClick={() => setShowRescueModal(false)}>
                                <X size={18} />
                            </button>
                        </div>

                        <div className="rescue-modal-body">
                            <div className="stats-grid">
                                <div className={`stat-card waiting ${rescueTab === 'waiting' ? 'stat-active' : ''}`} onClick={() => setRescueTab('waiting')}>
                                    <div className="stat-icon"><AlertCircle size={20} /></div>
                                    <div className="stat-value">{stats.waiting}</div>
                                    <div className="stat-label">รอการช่วยเหลือ</div>
                                </div>
                                <div className={`stat-card in-progress ${rescueTab === 'in_progress' ? 'stat-active' : ''}`} onClick={() => setRescueTab('in_progress')}>
                                    <div className="stat-icon"><Zap size={20} /></div>
                                    <div className="stat-value">{stats.in_progress}</div>
                                    <div className="stat-label">กำลังดำเนินการ</div>
                                </div>
                                <div className={`stat-card completed ${rescueTab === 'completed' ? 'stat-active' : ''}`} onClick={() => setRescueTab('completed')}>
                                    <div className="stat-icon"><ShieldCheck size={20} /></div>
                                    <div className="stat-value">{stats.completed}</div>
                                    <div className="stat-label">ช่วยเหลือสำเร็จ</div>
                                </div>
                            </div>

                            <div className="search-sort-container">
                                <div className="rescue-search-wrapper">
                                    <Search size={15} className="rescue-search-icon" />
                                    <input
                                        className="incident-search rescue-search-input"
                                        type="text"
                                        placeholder="ค้นหาเคส, ชื่อผู้แจ้ง..."
                                        value={rescueSearch}
                                        onChange={(e) => setRescueSearch(e.target.value)}
                                    />
                                </div>
                                <select
                                    className="incident-sort"
                                    value={sortOrder}
                                    onChange={(e) => setSortOrder(e.target.value)}
                                >
                                    <option value="newest">ใหม่ล่าสุด</option>
                                    <option value="oldest">เก่าที่สุด</option>
                                </select>
                            </div>

                            <div className="rescue-list">
                                {rescueFilteredIncidents.length === 0 ? (
                                    <div className="rescue-empty">
                                        <ShieldCheck size={40} strokeWidth={1.2} />
                                        <p>ไม่มีรายการในหมวดนี้</p>
                                    </div>
                                ) : (
                                    rescueFilteredIncidents.map(item => {
                                        const statusKey = item.status === 'กำลังดำเนินการ' ? 'inprogress' : item.status === 'ช่วยเหลือสำเร็จ' ? 'done' : 'waiting';
                                        return (
                                            <div key={item.id} className={`rescue-item rescue-item-${statusKey}`}>
                                                <div className="rescue-info">
                                                    <div className="rescue-item-top">
                                                        <h4>{item.title}</h4>
                                                        <span className={`rescue-badge rescue-badge-${statusKey}`}>
                                                            {item.status || 'รอการช่วยเหลือ'}
                                                        </span>
                                                    </div>
                                                    {item.description && <p className="rescue-desc">{item.description}</p>}
                                                    <div className="rescue-meta">
                                                        <span><MapPin size={12} /> {item.lat.toFixed(4)}, {item.lng.toFixed(4)}</span>
                                                        <span><User size={12} /> {item.users_app?.full_name}</span>
                                                        <span><Clock size={12} /> {new Date(item.created_at).toLocaleString('th-TH')}</span>
                                                    </div>
                                                    {item.assignments?.[0]?.users_app?.full_name && (
                                                        <div className="rescue-volunteer-row">
                                                            <Ambulance size={12} />
                                                            รับเคสโดย: <strong>{item.assignments[0].users_app.full_name}</strong>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="rescue-actions-group">
                                                    {item.status !== 'ช่วยเหลือสำเร็จ' && (
                                                        <button className="action-btn" onClick={() => { handleClickIncident(item); setShowRescueModal(false); }}>
                                                            <MapPin size={13} /> ดูพิกัด
                                                        </button>
                                                    )}
                                                    {item.status === 'รอการช่วยเหลือ' && (
                                                        <button className="action-btn action-btn-accept" onClick={() => handleAcceptCase(item)}>
                                                            รับเคส
                                                        </button>
                                                    )}
                                                    {item.status === 'กำลังดำเนินการ' && item.assignments?.[0]?.volunteer_id === user?.id && (
                                                        <button className="action-btn action-btn-complete" onClick={() => handleCompleteCase(item)}>
                                                            ช่วยเหลือสำเร็จ
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}

"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import Swal from "sweetalert2";
import { Shield, Search, RefreshCw, Siren, Users, Clock, BarChart2, Eye, X, MapPin, Phone, Mail, Calendar, CheckCircle, XCircle } from "lucide-react";
import "./admin.css";

export default function AdminPage() {
    const router = useRouter();
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [activeTab, setActiveTab] = useState("incidents");

    const [incidents, setIncidents] = useState([]);
    const [volunteers, setVolunteers] = useState([]);
    const [loadingIncidents, setLoadingIncidents] = useState(false);
    const [loadingVolunteers, setLoadingVolunteers] = useState(false);
    const [bulkLoading, setBulkLoading] = useState(false);
    const [detailIncident, setDetailIncident] = useState(null);

    // Filters
    const [incidentFilter, setIncidentFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");

    // Bulk select
    const [selectedIds, setSelectedIds] = useState(new Set());

    useEffect(() => {
        const checkAdmin = async () => {
            const { data } = await supabase.auth.getSession();
            if (!data.session?.user) { router.replace("/dashboard"); return; }

            const { data: userData } = await supabase
                .from("users_app").select("role").eq("id", data.session.user.id).single();

            if (!userData || userData.role !== "admin") {
                Swal.fire({ icon: "error", title: "ไม่มีสิทธิ์เข้าถึง", confirmButtonColor: "#ef4444" })
                    .then(() => router.replace("/dashboard"));
                return;
            }

            setCheckingAuth(false);
            fetchIncidents();
            fetchVolunteers();
        };
        checkAdmin();
    }, []);

    const fetchIncidents = async () => {
        setLoadingIncidents(true);
        setSelectedIds(new Set());
        try {
            const res = await fetch("/api/admin/incidents");
            const result = await res.json();
            if (result.success) setIncidents(result.data || []);
        } catch (err) { console.error(err); }
        finally { setLoadingIncidents(false); }
    };

    const fetchVolunteers = async () => {
        setLoadingVolunteers(true);
        try {
            const res = await fetch("/api/admin/volunteers");
            const result = await res.json();
            if (result.success) setVolunteers(result.data || []);
        } catch (err) { console.error(err); }
        finally { setLoadingVolunteers(false); }
    };

    // ===== Single actions =====
    const patchIncident = async (id, approval_status) => {
        await fetch("/api/admin/incidents", {
            method: "PATCH", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, approval_status }),
        });
    };

    const handleApproveIncident = async (id) => {
        await patchIncident(id, "approved");
        Swal.fire({ icon: "success", title: "อนุมัติแล้ว", timer: 1000, showConfirmButton: false });
        fetchIncidents();
    };

    const handleRejectIncident = async (id) => {
        const confirm = await Swal.fire({
            html: `<div style="padding:8px 0 4px"><div style="width:64px;height:64px;background:#fef2f2;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 18px;border:2px solid #fecaca"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg></div><h2 style="font-size:1.2rem;font-weight:800;color:#1e293b;margin:0 0 8px;font-family:inherit">ปฏิเสธการแจ้งเหตุ?</h2><p style="color:#64748b;font-size:0.875rem;margin:0;font-family:inherit">การแจ้งเหตุนี้จะไม่แสดงบนแผนที่</p></div>`,
            showCancelButton: true, confirmButtonText: "ปฏิเสธ", cancelButtonText: "ยกเลิก",
            confirmButtonColor: "#ef4444", cancelButtonColor: "#f1f5f9",
            customClass: { popup: "swal-admin-popup", confirmButton: "swal-admin-confirm", cancelButton: "swal-admin-cancel" },
        });
        if (!confirm.isConfirmed) return;
        await patchIncident(id, "rejected");
        Swal.fire({ icon: "success", title: "ปฏิเสธแล้ว", timer: 1000, showConfirmButton: false });
        fetchIncidents();
    };

    const handleDeleteIncident = async (id, title) => {
        const confirm = await Swal.fire({
            html: `<div style="padding:8px 0 4px"><div style="width:64px;height:64px;background:#fef2f2;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 18px;border:2px solid #fecaca"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg></div><h2 style="font-size:1.2rem;font-weight:800;color:#1e293b;margin:0 0 8px;font-family:inherit">ลบการแจ้งเหตุ?</h2><p style="color:#64748b;font-size:0.875rem;margin:0;font-family:inherit;line-height:1.6"><b style="color:#1e293b">${title}</b><br/>ไม่สามารถย้อนกลับได้</p></div>`,
            showCancelButton: true, confirmButtonText: "ลบ", cancelButtonText: "ยกเลิก",
            confirmButtonColor: "#ef4444", cancelButtonColor: "#f1f5f9",
            customClass: { popup: "swal-admin-popup", confirmButton: "swal-admin-confirm", cancelButton: "swal-admin-cancel" },
        });
        if (!confirm.isConfirmed) return;
        await fetch("/api/admin/incidents", {
            method: "DELETE", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
        });
        Swal.fire({ icon: "success", title: "ลบแล้ว", timer: 1000, showConfirmButton: false });
        fetchIncidents();
    };

    const handleApproveVolunteer = async (id, name) => {
        await fetch("/api/admin/volunteers", {
            method: "PATCH", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, is_approved: true }),
        });
        Swal.fire({ icon: "success", title: `อนุมัติ ${name} แล้ว`, timer: 1200, showConfirmButton: false });
        fetchVolunteers();
    };

    const handleRejectVolunteer = async (id, name) => {
        const confirm = await Swal.fire({
            html: `<div style="padding:8px 0 4px"><div style="width:64px;height:64px;background:#fef2f2;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 18px;border:2px solid #fecaca"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="23" y1="11" x2="17" y2="11"/></svg></div><h2 style="font-size:1.2rem;font-weight:800;color:#1e293b;margin:0 0 8px;font-family:inherit">ปฏิเสธ ${name}?</h2><p style="color:#64748b;font-size:0.875rem;margin:0;font-family:inherit">อาสาสมัครคนนี้จะไม่สามารถเข้าสู่ระบบได้</p></div>`,
            showCancelButton: true, confirmButtonText: "ปฏิเสธ", cancelButtonText: "ยกเลิก",
            confirmButtonColor: "#ef4444", cancelButtonColor: "#f1f5f9",
            customClass: { popup: "swal-admin-popup", confirmButton: "swal-admin-confirm", cancelButton: "swal-admin-cancel" },
        });
        if (!confirm.isConfirmed) return;
        await fetch("/api/admin/volunteers", {
            method: "PATCH", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, is_approved: false }),
        });
        Swal.fire({ icon: "info", title: `ปฏิเสธ ${name} แล้ว`, timer: 1200, showConfirmButton: false });
        fetchVolunteers();
    };

    // ===== Bulk actions =====
    const handleBulkAction = async (approval_status) => {
        const ids = [...selectedIds];
        if (!ids.length) return;
        const label = approval_status === "approved" ? "อนุมัติ" : "ปฏิเสธ";
        const result = await Swal.fire({
            html: `<div style="padding:8px 0 4px"><h2 style="font-size:1.15rem;font-weight:800;color:#1e293b;margin:0 0 8px;font-family:inherit">${label} ${ids.length} รายการ?</h2><p style="color:#64748b;font-size:0.875rem;margin:0;font-family:inherit">การกระทำนี้จะส่งผลกับทุกรายการที่เลือก</p></div>`,
            showCancelButton: true, confirmButtonText: label, cancelButtonText: "ยกเลิก",
            confirmButtonColor: approval_status === "approved" ? "#22c55e" : "#ef4444",
            cancelButtonColor: "#f1f5f9",
            customClass: { popup: "swal-admin-popup", confirmButton: "swal-admin-confirm", cancelButton: "swal-admin-cancel" },
        });
        if (!result.isConfirmed) return;
        setBulkLoading(true);
        await Promise.all(ids.map(id => patchIncident(id, approval_status)));
        setBulkLoading(false);
        Swal.fire({ icon: "success", title: `${label} ${ids.length} รายการแล้ว`, timer: 1500, showConfirmButton: false });
        fetchIncidents();
    };

    const handleApproveAll = async () => {
        const pending = filteredIncidents.filter(i => i.approval_status !== "approved");
        if (!pending.length) return;
        const result = await Swal.fire({
            html: `<div style="padding:8px 0 4px"><h2 style="font-size:1.15rem;font-weight:800;color:#1e293b;margin:0 0 8px;font-family:inherit">อนุมัติทั้งหมด ${pending.length} รายการ?</h2><p style="color:#64748b;font-size:0.875rem;margin:0;font-family:inherit">รายการที่กรองอยู่ทั้งหมดจะถูกอนุมัติ</p></div>`,
            showCancelButton: true, confirmButtonText: "อนุมัติทั้งหมด", cancelButtonText: "ยกเลิก",
            confirmButtonColor: "#22c55e", cancelButtonColor: "#f1f5f9",
            customClass: { popup: "swal-admin-popup", confirmButton: "swal-admin-confirm", cancelButton: "swal-admin-cancel" },
        });
        if (!result.isConfirmed) return;
        setBulkLoading(true);
        await Promise.all(pending.map(i => patchIncident(i.id, "approved")));
        setBulkLoading(false);
        Swal.fire({ icon: "success", title: `อนุมัติ ${pending.length} รายการแล้ว`, timer: 1500, showConfirmButton: false });
        fetchIncidents();
    };

    const handleRejectAll = async () => {
        const notRejected = filteredIncidents.filter(i => i.approval_status !== "rejected");
        if (!notRejected.length) return;
        const result = await Swal.fire({
            html: `<div style="padding:8px 0 4px"><h2 style="font-size:1.15rem;font-weight:800;color:#1e293b;margin:0 0 8px;font-family:inherit">ปฏิเสธทั้งหมด ${notRejected.length} รายการ?</h2><p style="color:#64748b;font-size:0.875rem;margin:0;font-family:inherit">รายการที่กรองอยู่ทั้งหมดจะถูกปฏิเสธ</p></div>`,
            showCancelButton: true, confirmButtonText: "ปฏิเสธทั้งหมด", cancelButtonText: "ยกเลิก",
            confirmButtonColor: "#ef4444", cancelButtonColor: "#f1f5f9",
            customClass: { popup: "swal-admin-popup", confirmButton: "swal-admin-confirm", cancelButton: "swal-admin-cancel" },
        });
        if (!result.isConfirmed) return;
        setBulkLoading(true);
        await Promise.all(notRejected.map(i => patchIncident(i.id, "rejected")));
        setBulkLoading(false);
        Swal.fire({ icon: "success", title: `ปฏิเสธ ${notRejected.length} รายการแล้ว`, timer: 1500, showConfirmButton: false });
        fetchIncidents();
    };

    // ===== Filtering =====
    const filteredIncidents = useMemo(() => {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);
        const monthAgo = new Date(today); monthAgo.setDate(monthAgo.getDate() - 30);
        const q = searchQuery.toLowerCase();

        return incidents.filter(i => {
            const statusOk = incidentFilter === "all" ? true
                : incidentFilter === "pending" ? (i.approval_status === "pending" || !i.approval_status)
                    : i.approval_status === incidentFilter;

            const created = new Date(i.created_at);
            const dateOk = dateFilter === "all" ? true
                : dateFilter === "today" ? created >= today
                    : dateFilter === "week" ? created >= weekAgo
                        : created >= monthAgo;

            const searchOk = !q || (i.title || "").toLowerCase().includes(q)
                || (i.description || "").toLowerCase().includes(q)
                || (i.users_app?.full_name || "").toLowerCase().includes(q)
                || (i.users_app?.phone_number || "").includes(q);

            return statusOk && dateOk && searchOk;
        });
    }, [incidents, incidentFilter, dateFilter, searchQuery]);

    // ===== Stats =====
    const stats = useMemo(() => {
        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
        return {
            total: incidents.length,
            todayNew: incidents.filter(i => new Date(i.created_at) >= todayStart).length,
            pending: incidents.filter(i => i.approval_status === "pending" || !i.approval_status).length,
            activeVols: volunteers.filter(v => v.is_approved === true).length,
        };
    }, [incidents, volunteers]);

    // ===== Checkbox logic =====
    const allSelected = filteredIncidents.length > 0 && filteredIncidents.every(i => selectedIds.has(i.id));
    const someSelected = filteredIncidents.some(i => selectedIds.has(i.id));

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredIncidents.map(i => i.id)));
        }
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const pendingVolunteers = volunteers.filter(v => v.is_approved === false);
    const approvedVolunteers = volunteers.filter(v => v.is_approved === true);

    if (checkingAuth) return <div className="admin-loading">กำลังตรวจสอบสิทธิ์...</div>;

    return (
        <div className="admin-root">
            <div className="admin-topbar">
                <div className="admin-logo"><Shield size={22} /> Admin Panel</div>
                <button className="admin-back-btn" onClick={() => router.push("/dashboard")}>กลับสู่ Dashboard</button>
            </div>

            <div className="admin-body">

                {/* ===== Stats Cards ===== */}
                <div className="admin-stats-grid">
                    <div className="admin-stat-card">
                        <div className="admin-stat-icon" style={{ background: "#dbeafe", color: "#1d4ed8" }}><BarChart2 size={20} /></div>
                        <div>
                            <div className="admin-stat-value">{stats.total}</div>
                            <div className="admin-stat-label">เหตุการณ์ทั้งหมด</div>
                        </div>
                    </div>
                    <div className="admin-stat-card">
                        <div className="admin-stat-icon" style={{ background: "#dcfce7", color: "#16a34a" }}><Siren size={20} /></div>
                        <div>
                            <div className="admin-stat-value">{stats.todayNew}</div>
                            <div className="admin-stat-label">เหตุการณ์วันนี้</div>
                        </div>
                    </div>
                    <div className="admin-stat-card" onClick={() => { setActiveTab("incidents"); setIncidentFilter("pending"); }} style={{ cursor: "pointer" }}>
                        <div className="admin-stat-icon" style={{ background: "#fef9c3", color: "#ca8a04" }}><Clock size={20} /></div>
                        <div>
                            <div className="admin-stat-value">{stats.pending}</div>
                            <div className="admin-stat-label">รออนุมัติ</div>
                        </div>
                        {stats.pending > 0 && <span className="admin-stat-badge">{stats.pending}</span>}
                    </div>
                    <div className="admin-stat-card" onClick={() => setActiveTab("volunteers")} style={{ cursor: "pointer" }}>
                        <div className="admin-stat-icon" style={{ background: "#f3e8ff", color: "#7c3aed" }}><Users size={20} /></div>
                        <div>
                            <div className="admin-stat-value">{stats.activeVols}</div>
                            <div className="admin-stat-label">อาสาสมัครที่ active</div>
                        </div>
                    </div>
                </div>

                {/* ===== Tabs ===== */}
                <div className="admin-tabs">
                    <button className={`admin-tab ${activeTab === "incidents" ? "active" : ""}`} onClick={() => setActiveTab("incidents")}>
                        การแจ้งเหตุ
                        {stats.pending > 0 && <span className="tab-badge">{stats.pending}</span>}
                    </button>
                    <button className={`admin-tab ${activeTab === "volunteers" ? "active" : ""}`} onClick={() => setActiveTab("volunteers")}>
                        อาสาสมัคร
                        {pendingVolunteers.length > 0 && <span className="tab-badge">{pendingVolunteers.length}</span>}
                    </button>
                </div>

                {/* ===== Incidents Tab ===== */}
                {activeTab === "incidents" && (
                    <div className="admin-section">
                        <div className="admin-section-header">
                            <h2>จัดการการแจ้งเหตุ <span className="admin-count-badge">{filteredIncidents.length}</span></h2>
                            <div className="admin-header-actions">
                                <button className="admin-refresh-btn" onClick={fetchIncidents} disabled={loadingIncidents}>
                                    <RefreshCw size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Search + Filter row */}
                        <div className="admin-filter-row">
                            <div className="admin-search-wrap">
                                <Search size={15} className="admin-search-icon" />
                                <input
                                    className="admin-search-input"
                                    placeholder="ค้นหาหัวข้อ, ผู้แจ้ง, เบอร์โทร..."
                                    value={searchQuery}
                                    onChange={(e) => { setSearchQuery(e.target.value); setSelectedIds(new Set()); }}
                                />
                            </div>
                            <select className="admin-select" value={incidentFilter} onChange={(e) => { setIncidentFilter(e.target.value); setSelectedIds(new Set()); }}>
                                <option value="all">ทุกสถานะ</option>
                                <option value="pending">รอพิจารณา ({stats.pending})</option>
                                <option value="approved">อนุมัติแล้ว ({incidents.filter(i => i.approval_status === "approved").length})</option>
                                <option value="rejected">ปฏิเสธแล้ว ({incidents.filter(i => i.approval_status === "rejected").length})</option>
                            </select>
                            <select className="admin-select" value={dateFilter} onChange={(e) => { setDateFilter(e.target.value); setSelectedIds(new Set()); }}>
                                <option value="all">ทุกช่วงเวลา</option>
                                <option value="today">วันนี้</option>
                                <option value="week">7 วันที่ผ่านมา</option>
                                <option value="month">30 วันที่ผ่านมา</option>
                            </select>
                        </div>

                        {/* Bulk action bar */}
                        {selectedIds.size > 0 && (
                            <div className="admin-bulk-bar">
                                <span className="bulk-count">เลือกแล้ว <span>{selectedIds.size}</span> รายการ</span>
                                <button className="bulk-btn bulk-approve" onClick={() => handleBulkAction("approved")} disabled={bulkLoading}>
                                    อนุมัติที่เลือก
                                </button>
                                <button className="bulk-btn bulk-reject" onClick={() => handleBulkAction("rejected")} disabled={bulkLoading}>
                                    ปฏิเสธที่เลือก
                                </button>
                                <button className="bulk-btn bulk-clear" onClick={() => setSelectedIds(new Set())}>
                                    ยกเลิกการเลือก
                                </button>
                            </div>
                        )}

                        {loadingIncidents || bulkLoading ? (
                            <div className="admin-loading-inline">{bulkLoading ? "กำลังดำเนินการ..." : "กำลังโหลด..."}</div>
                        ) : filteredIncidents.length === 0 ? (
                            <div className="admin-empty">ไม่พบรายการที่ตรงกับการค้นหา</div>
                        ) : (
                            <div className="admin-table-wrapper">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: 40 }}>
                                                <input type="checkbox" checked={allSelected} ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }}
                                                    onChange={toggleSelectAll} className="admin-checkbox" />
                                            </th>
                                            <th>หัวข้อ</th>
                                            <th>ผู้แจ้ง</th>
                                            <th>เบอร์โทร</th>
                                            <th>วันที่แจ้ง</th>
                                            <th>สถานะอนุมัติ</th>
                                            <th>จัดการ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredIncidents.map(item => (
                                            <tr key={item.id} className={selectedIds.has(item.id) ? "row-selected" : ""}>
                                                <td>
                                                    <input type="checkbox" checked={selectedIds.has(item.id)}
                                                        onChange={() => toggleSelect(item.id)} className="admin-checkbox" />
                                                </td>
                                                <td>
                                                    <div className="incident-title-cell">{item.title}</div>
                                                    {item.description && <div className="incident-desc-cell">{item.description}</div>}
                                                </td>
                                                <td>{item.users_app?.full_name || "ไม่ทราบ"}</td>
                                                <td>{item.users_app?.phone_number || "-"}</td>
                                                <td>{new Date(item.created_at).toLocaleString("th-TH")}</td>
                                                <td>
                                                    <span className={`approval-badge approval-${item.approval_status || "pending"}`}>
                                                        {item.approval_status === "approved" ? "อนุมัติแล้ว"
                                                            : item.approval_status === "rejected" ? "ปฏิเสธแล้ว" : "รอพิจารณา"}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="action-cell">
                                                        <button className="action-btn-view" onClick={() => setDetailIncident(item)}>
                                                            <Eye size={14} />
                                                        </button>
                                                        {item.approval_status !== "approved" && (
                                                            <button className="action-btn-approve" onClick={() => handleApproveIncident(item.id)}>อนุมัติ</button>
                                                        )}
                                                        {item.approval_status !== "rejected" && (
                                                            <button className="action-btn-reject" onClick={() => handleRejectIncident(item.id)}>ปฏิเสธ</button>
                                                        )}
                                                        <button className="action-btn-delete" onClick={() => handleDeleteIncident(item.id, item.title)}>ลบ</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* ===== Volunteers Tab ===== */}
                {activeTab === "volunteers" && (
                    <div className="admin-section">
                        <div className="admin-section-header">
                            <h2>จัดการอาสาสมัคร</h2>
                            <button className="admin-refresh-btn" onClick={fetchVolunteers} disabled={loadingVolunteers}>
                                <RefreshCw size={14} />
                            </button>
                        </div>

                        {loadingVolunteers ? <div className="admin-loading-inline">กำลังโหลด...</div> : (
                            <>
                                {pendingVolunteers.length > 0 && (
                                    <div className="volunteer-section">
                                        <h3 className="volunteer-section-title pending-title">รอการอนุมัติ ({pendingVolunteers.length})</h3>
                                        <div className="admin-table-wrapper">
                                            <table className="admin-table">
                                                <thead>
                                                    <tr><th>ชื่อ - นามสกุล</th><th>อีเมล</th><th>เบอร์โทร</th><th>วันที่สมัคร</th><th>สถานะ</th><th>จัดการ</th></tr>
                                                </thead>
                                                <tbody>
                                                    {pendingVolunteers.map(v => (
                                                        <tr key={v.id}>
                                                            <td>{v.full_name}</td><td>{v.email}</td><td>{v.phone_number || "-"}</td>
                                                            <td>{new Date(v.created_at).toLocaleString("th-TH")}</td>
                                                            <td><span className="approval-badge approval-pending">รอการอนุมัติ</span></td>
                                                            <td>
                                                                <div className="action-cell">
                                                                    <button className="action-btn-approve" onClick={() => handleApproveVolunteer(v.id, v.full_name)}>อนุมัติ</button>
                                                                    <button className="action-btn-reject" onClick={() => handleRejectVolunteer(v.id, v.full_name)}>ปฏิเสธ</button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                                <div className="volunteer-section">
                                    <h3 className="volunteer-section-title approved-title">อนุมัติแล้ว ({approvedVolunteers.length})</h3>
                                    {approvedVolunteers.length === 0 ? <div className="admin-empty">ยังไม่มีอาสาสมัครที่อนุมัติแล้ว</div> : (
                                        <div className="admin-table-wrapper">
                                            <table className="admin-table">
                                                <thead>
                                                    <tr><th>ชื่อ - นามสกุล</th><th>อีเมล</th><th>เบอร์โทร</th><th>วันที่สมัคร</th><th>สถานะ</th><th>จัดการ</th></tr>
                                                </thead>
                                                <tbody>
                                                    {approvedVolunteers.map(v => (
                                                        <tr key={v.id}>
                                                            <td>{v.full_name}</td><td>{v.email}</td><td>{v.phone_number || "-"}</td>
                                                            <td>{new Date(v.created_at).toLocaleString("th-TH")}</td>
                                                            <td><span className="approval-badge approval-approved">อนุมัติแล้ว</span></td>
                                                            <td>
                                                                <div className="action-cell">
                                                                    <button className="action-btn-reject" onClick={() => handleRejectVolunteer(v.id, v.full_name)}>ยกเลิกสิทธิ์</button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        {/* ===== Detail Modal ===== */}
        {detailIncident && (
            <div className="detail-overlay" onClick={() => setDetailIncident(null)}>
                <div className="detail-modal" onClick={e => e.stopPropagation()}>

                    {/* Header */}
                    <div className="detail-header">
                        <div className="detail-header-top">
                            <span className={`approval-badge approval-${detailIncident.approval_status || "pending"}`}>
                                {detailIncident.approval_status === "approved" ? "อนุมัติแล้ว"
                                    : detailIncident.approval_status === "rejected" ? "ปฏิเสธแล้ว" : "รอพิจารณา"}
                            </span>
                            <button className="detail-close" onClick={() => setDetailIncident(null)}>
                                <X size={18} />
                            </button>
                        </div>
                        <h2 className="detail-title">{detailIncident.title}</h2>
                        {detailIncident.description && (
                            <p className="detail-desc">{detailIncident.description}</p>
                        )}
                    </div>

                    {/* Images */}
                    <div className="detail-images-section">
                        <div className="detail-section-label">รูปภาพ</div>
                        {detailIncident.incident_media?.length > 0 ? (
                            <div className="detail-images">
                                {detailIncident.incident_media.map(m => (
                                    <a key={m.id} href={m.file_url} target="_blank" rel="noopener noreferrer" className="detail-image-link">
                                        <img src={m.file_url} alt="" />
                                    </a>
                                ))}
                            </div>
                        ) : (
                            <p className="detail-no-images">ไม่มีรูปภาพ</p>
                        )}
                    </div>

                    {/* Info Grid */}
                    <div className="detail-info-grid">
                        <div className="detail-info-card">
                            <div className="detail-info-label"><Mail size={13} /> ผู้แจ้งเหตุ</div>
                            <div className="detail-info-value">{detailIncident.users_app?.full_name || "-"}</div>
                            <div className="detail-info-sub">{detailIncident.users_app?.email}</div>
                        </div>
                        <div className="detail-info-card">
                            <div className="detail-info-label"><Phone size={13} /> เบอร์โทร</div>
                            <div className="detail-info-value">{detailIncident.users_app?.phone_number || "-"}</div>
                        </div>
                        <div className="detail-info-card">
                            <div className="detail-info-label"><Calendar size={13} /> วันที่แจ้ง</div>
                            <div className="detail-info-value">{new Date(detailIncident.created_at).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })}</div>
                            <div className="detail-info-sub">{new Date(detailIncident.created_at).toLocaleTimeString("th-TH")}</div>
                        </div>
                        <div className="detail-info-card">
                            <div className="detail-info-label"><Siren size={13} /> สถานะเหตุการณ์</div>
                            <div className="detail-info-value">{detailIncident.status || "รอการช่วยเหลือ"}</div>
                        </div>
                    </div>

                    {/* Location */}
                    <a
                        href={`https://www.google.com/maps/search/?api=1&query=${detailIncident.lat},${detailIncident.lng}`}
                        target="_blank" rel="noopener noreferrer"
                        className="detail-map-link"
                    >
                        <MapPin size={16} />
                        <span>{Number(detailIncident.lat).toFixed(6)}, {Number(detailIncident.lng).toFixed(6)}</span>
                        <span className="detail-map-open">เปิด Google Maps →</span>
                    </a>

                    {/* Volunteer */}
                    {detailIncident.assignments?.[0]?.users_app?.full_name && (
                        <div className="detail-volunteer">
                            <CheckCircle size={15} color="#22c55e" />
                            <span>รับเคสโดย <strong>{detailIncident.assignments[0].users_app.full_name}</strong></span>
                            {detailIncident.assignments[0].users_app.phone_number && (
                                <span className="detail-vol-phone">· {detailIncident.assignments[0].users_app.phone_number}</span>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="detail-actions">
                        {detailIncident.approval_status !== "approved" && (
                            <button className="detail-action-approve" onClick={() => { handleApproveIncident(detailIncident.id); setDetailIncident(null); }}>
                                <CheckCircle size={15} /> อนุมัติ
                            </button>
                        )}
                        {detailIncident.approval_status !== "rejected" && (
                            <button className="detail-action-reject" onClick={() => { handleRejectIncident(detailIncident.id); setDetailIncident(null); }}>
                                <XCircle size={15} /> ปฏิเสธ
                            </button>
                        )}
                        <button className="detail-action-delete" onClick={() => { handleDeleteIncident(detailIncident.id, detailIncident.title); setDetailIncident(null); }}>
                            ลบ
                        </button>
                    </div>
                </div>
            </div>
        )}
        </div>
    );
}

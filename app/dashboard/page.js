"use client";
import dynamic from "next/dynamic";
import { useState, useEffect, useRef } from "react";
import "./dashboard.css";
import { supabase } from "../lib/supabaseClient";
import Swal from "sweetalert2";

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
    const [rescueTab, setRescueTab] = useState('waiting'); // waiting, in_progress, completed
    const [search, setSearch] = useState("");
    const [rescueSearch, setRescueSearch] = useState("");
    const [sortOrder, setSortOrder] = useState("newest"); // 'newest' | 'oldest'
    const [userRole, setUserRole] = useState("user"); // 'user' | 'volunteer'

    const [users_app, setUsers_app] = useState({
        full_name: "",
        email: "",
        password: "",
    });

    const mapRef = useRef(null);

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
            icon: "warning",
            title: "ออกจากระบบ?",
            text: "คุณต้องการออกจากระบบใช่ไหม",
            showCancelButton: true,
            confirmButtonText: "ออกจากระบบ",
            cancelButtonText: "ยกเลิก",
            confirmButtonColor: "#ef4444",
        });

        if (!result.isConfirmed) return;

        const { error } = await supabase.auth.signOut();

        if (error) {
            Swal.fire("ผิดพลาด", "ออกจากระบบไม่สำเร็จ", "error");
            return;
        }

        window.location.href = "/login";
    };

    // ✅ เช็ก session
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

                // Fetch Role
                const { data: userData, error: userError } = await supabase
                    .from("users_app")
                    .select("role")
                    .eq("id", data.session.user.id)
                    .single();

                if (!userError && userData) {
                    setUserRole(userData.role || "user");
                }

                setCheckingAuth(false);
            } else {
                setCheckingAuth(false);
                Swal.fire({
                    icon: "error",
                    title: "โปรดเข้าสู่ระบบก่อนเข้าใช้งาน Dashboard",
                    timer: 2500,
                    timerProgressBar: true,
                    showConfirmButton: false,
                }).then(() => {
                    window.location.href = "/login";
                });
            }
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
            // 1) อัปเดต email / password
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

            // 2) อัปเดตชื่อ
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

    const filteredIncidents = incidents.filter((item) => {
        const q = search.toLowerCase();
        return (
            (item.title || "").toLowerCase().includes(q) ||
            (item.description || "").toLowerCase().includes(q) ||
            (item.users_app?.full_name || "").toLowerCase().includes(q)
        );
    });

    // Rescue Stats & Filter
    const stats = {
        waiting: incidents.filter(i => !i.status || i.status === 'รอการช่วยเหลือ').length,
        in_progress: incidents.filter(i => i.status === 'กำลังดำเนินการ').length,
        completed: incidents.filter(i => {
            if (i.status !== 'ช่วยเหลือสำเร็จ') return false;
            const itemDate = new Date(i.created_at).toDateString();
            const today = new Date().toDateString();
            return itemDate === today;
        }).length
    };

    const rescueFilteredIncidents = incidents.filter(item => {
        const status = item.status || 'รอการช่วยเหลือ';

        let targetStatus = 'รอการช่วยเหลือ';
        if (rescueTab === 'in_progress') targetStatus = 'กำลังดำเนินการ';
        if (rescueTab === 'completed') targetStatus = 'ช่วยเหลือสำเร็จ';

        let matchesStatus = (status === targetStatus);

        if (rescueTab === 'completed') {
            const itemDate = new Date(item.created_at).toDateString();
            const today = new Date().toDateString();
            matchesStatus = matchesStatus && (itemDate === today);
        }

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
            alert("ยังไม่ได้เข้าสู่ระบบ");
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
                alert(data.error || "บันทึกไม่สำเร็จ");
                return;
            }

            Swal.fire({
                icon: "success",
                title: "แจ้งเหตุสำเร็จ!",
                timer: 2000,
                showConfirmButton: false,
            });

            await fetchIncidents();

            setTitle("");
            setDescription("");
            setSelectedPosition(null);
            setShowReport(false);
        } catch (err) {
            console.error(err);
            alert("เกิดข้อผิดพลาด");
        } finally {
            setLoading(false);
        }
    };

    const handleSelectPosition = (pos) => {
        setSelectedPosition(pos);
        setIsPickingLocation(false);
        setShowReport(true);
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
            // 1. Update Incident Status
            const resIncident = await fetch('/api/incidents', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: item.id, status: 'กำลังดำเนินการ' })
            });

            if (!resIncident.ok) throw new Error('Failed to update incident status');

            // 2. Create Assignment
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

            // 3. Refresh Data
            fetchIncidents();
        } catch (err) {
            console.error(err);
            Swal.fire('Error', 'เกิดข้อผิดพลาดในการรับเคส', 'error');
        }
    };

    const handleCompleteCase = async (item) => {
        if (!user) return;

        try {
            // 1. Update Incident Status
            const resIncident = await fetch('/api/incidents', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: item.id, status: 'ช่วยเหลือสำเร็จ' })
            });

            if (!resIncident.ok) throw new Error('Failed to update incident status');

            // 2. Update Assignment Status
            const resAssignment = await fetch('/api/assignments', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    incident_id: item.id,
                    volunteer_id: user.id,
                    status: 'success'
                })
            });

            if (!resAssignment.ok) throw new Error('Failed to update assignment status');

            Swal.fire({
                icon: 'success',
                title: 'ปิดงานสำเร็จ!',
                text: 'ขอบคุณสำหรับการช่วยเหลือ',
                timer: 1500,
                showConfirmButton: false
            });

            // 3. Refresh Data
            fetchIncidents();
        } catch (err) {
            console.error(err);
            Swal.fire('Error', 'เกิดข้อผิดพลาดในการปิดงาน', 'error');
        }
    };

    return (
        <div className="dashboard-root">
            {/* ... Topbar ... */}
            <div className="topbar">
                <div className="logo">
                    <span className="logo-icon"></span>
                    SOS Command
                </div>

                <div className="topbar-right">
                    {userRole === "volunteer" && (
                        <button
                            className="rescue-view-btn"
                            onClick={() => setShowRescueModal(true)}
                        >
                            มุมมองสำหรับกู้ภัย
                        </button>
                    )}
                    <div className="user">{user ? user.email : "Guest"}</div>
                    <button className="logout-btn" onClick={handleLogout}>
                        ออก
                    </button>
                </div>
            </div>

            {/* ... Map Area ... */}
            <div className="main-area">
                <LeafletMap
                    initialPosition={selectedPosition}
                    onSelectLocation={handleSelectPosition}
                    incidents={incidents.filter(i => i.status !== 'ช่วยเหลือสำเร็จ')}
                    selectedIncidentId={selectedIncidentId}
                />
            </div>

            {/* ... Bottom Panel ... */}
            <div className="bottom-panel">
                <div className="incident-list">
                    {/* Filter out completed incidents */}
                    {incidents.filter(i => i.status !== 'ช่วยเหลือสำเร็จ').slice(0, 5).map((item) => (
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
                    {incidents.filter(i => i.status !== 'ช่วยเหลือสำเร็จ').length === 0 && (
                        <div className="incident-item incident-item-empty">
                            <h3>ยังไม่มีเหตุฉุกเฉิน</h3>
                        </div>
                    )}
                </div>
            </div>

            {/* ... Bottom Nav ... */}
            <div className="bottom-nav">
                <button
                    className="nav-btn"
                    onClick={() => setShowAllReports(true)}
                >
                    <div className="icon">📰</div>
                    <span>ข่าวสาร</span>
                </button>

                <button
                    className="nav-btn"
                    onClick={() => Swal.fire({
                        icon: "info",
                        title: "เรียกกู้ภัย",
                        text: "ฟีเจอร์นี้อยู่ระหว่างการพัฒนา.",
                        confirmButtonText: "ตกลง",
                        confirmButtonColor: "#ef4444"
                    })}
                >
                    <div className="icon">🚑</div>
                    <span>กู้ภัย</span>
                </button>

                <button
                    className="nav-btn sos-btn"
                    onClick={() => {
                        setShowReport(true);
                        setIsPickingLocation(false);
                    }}
                >
                    <div className="icon">🚨</div>
                    <span>แจ้งเหตุ</span>
                </button>

                <button
                    className="nav-btn"
                    onClick={() => Swal.fire({
                        icon: "info",
                        title: "ประวัติการแจ้งเหตุ",
                        text: "ฟีเจอร์นี้กำลังพัฒนา...",
                        confirmButtonText: "ตกลง"
                    })}
                >
                    <div className="icon">📜</div>
                    <span>ประวัติ</span>
                </button>

                <button className="nav-btn" onClick={() => setShowSettings(true)}>
                    <div className="icon">⚙️</div>
                    <span>ตั้งค่า</span>
                </button>
            </div>

            {/* ... Report Modal ... */}
            {showReport && !isPickingLocation && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h2>🚨 แจ้งเหตุฉุกเฉิน</h2>

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
                                <div
                                    className="coords-box"
                                    onClick={() => {
                                        setShowReport(false);
                                        setIsPickingLocation(true);
                                    }}
                                >
                                    {selectedPosition ? (
                                        <span>
                                            ✅ เลือกจุดแล้ว ({selectedPosition.lat.toFixed(4)}, {selectedPosition.lng.toFixed(4)})
                                        </span>
                                    ) : (
                                        <span className="coords-placeholder">
                                            📍 แตะเพื่อเลือกจุดบนแผนที่
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="form-actions">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowReport(false);
                                        setSelectedPosition(null);
                                        setTitle("");
                                        setDescription("");
                                    }}
                                >
                                    ยกเลิก
                                </button>
                                <button type="submit" disabled={loading}>
                                    {loading ? "กำลังส่ง..." : "ส่งแจ้งเหตุ"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ... Picking Tip ... */}
            {isPickingLocation && (
                <div className="picking-location-tip">
                    📍 แตะบนแผนที่เพื่อระบุจุดเกิดเหตุ
                </div>
            )}

            {/* ... Settings Modal ... */}
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

            {/* ... All Reports Modal (News) ... */}
            {showAllReports && (
                <div className="modal-overlay">
                    <div className="modal modal-scroll modal-content-scroll">
                        <h2>📋 เหตุฉุกเฉินทั้งหมด</h2>

                        <input
                            className="incident-search"
                            type="text"
                            placeholder="ค้นหาชื่อเหตุการณ์ / ผู้แจ้ง / รายละเอียด..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />

                        {incidents.length === 0 ? (
                            <div className="empty-text">ยังไม่มีรายงาน</div>
                        ) : (
                            <div className="all-reports-list">
                                {filteredIncidents.length === 0 ? (
                                    <div className="empty-text">ไม่พบข้อมูล</div>
                                ) : (
                                    filteredIncidents.map((item) => (
                                        <div key={item.id} className="report-card">
                                            <div className="report-title">🚨 {item.title}</div>
                                            <div className="report-desc">
                                                {item.description || "-"}
                                            </div>
                                            <div className="report-meta">
                                                <span>โดย: {item.users_app?.full_name || "Guest"}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        <div className="form-actions">
                            <button onClick={() => setShowAllReports(false)}>ปิด</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Rescue View Modal */}
            {
                showRescueModal && (
                    <div className="modal-overlay">
                        <div className="modal modal-xl">
                            <div className="modal-header">
                                <h2>ศูนย์บัญชาการกู้ภัย</h2>
                                <button className="close-btn" onClick={() => setShowRescueModal(false)}>×</button>
                            </div>

                            {/* Stats Cards */}
                            <div className="stats-grid">
                                <div className="stat-card waiting" onClick={() => setRescueTab('waiting')}>
                                    <div className="stat-value">{stats.waiting}</div>
                                    <div className="stat-label">รอการช่วยเหลือ</div>
                                </div>
                                <div className="stat-card in-progress" onClick={() => setRescueTab('in_progress')}>
                                    <div className="stat-value">{stats.in_progress}</div>
                                    <div className="stat-label">กำลังดำเนินการ</div>
                                </div>
                                <div className="stat-card completed" onClick={() => setRescueTab('completed')}>
                                    <div className="stat-value">{stats.completed}</div>
                                    <div className="stat-label">ช่วยเหลือสำเร็จ</div>
                                </div>
                            </div>

                            {/* Filtered List */}
                            <div className="rescue-list-container">
                                <h3>รายการ: {
                                    rescueTab === 'waiting' ? 'รอการช่วยเหลือ' :
                                        rescueTab === 'in_progress' ? 'กำลังดำเนินการ' :
                                            'ช่วยเหลือสำเร็จ'
                                }</h3>

                                <div className="search-sort-container">
                                    <input
                                        className="incident-search"
                                        type="text"
                                        placeholder="ค้นหาเคส..."
                                        value={rescueSearch}
                                        onChange={(e) => setRescueSearch(e.target.value)}
                                    />
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
                                        <div className="empty-text">ไม่มีรายการในช่วงนี้</div>
                                    ) : (
                                        rescueFilteredIncidents.map(item => (
                                            <div key={item.id} className="rescue-item">
                                                <div className={`status-indicator ${item.status || 'waiting'}`}></div>
                                                <div className="rescue-info">
                                                    <h4>{item.title}</h4>
                                                    <p>{item.description}</p>
                                                    <small>
                                                        📍 {item.lat.toFixed(4)}, {item.lng.toFixed(4)} | 👤 {item.users_app?.full_name} <br />
                                                        🕒 {new Date(item.created_at).toLocaleString('th-TH')}
                                                        {item.assignments?.[0]?.users_app?.full_name && (
                                                            <>
                                                                <br />
                                                                🚑 รับเคสโดย: <span className="volunteer-name">{item.assignments[0].users_app.full_name}</span>
                                                            </>
                                                        )}
                                                    </small>
                                                </div>
                                                <div className="rescue-actions-group">
                                                    {item.status !== 'ช่วยเหลือสำเร็จ' && (
                                                        <button
                                                            className="action-btn"
                                                            onClick={() => {
                                                                handleClickIncident(item);
                                                                setShowRescueModal(false);
                                                            }}
                                                        >
                                                            ดูพิกัด
                                                        </button>
                                                    )}
                                                    {item.status === 'รอการช่วยเหลือ' && (
                                                        <button
                                                            className="action-btn action-btn-accept"
                                                            onClick={() => handleAcceptCase(item)}
                                                        >
                                                            รับเคส
                                                        </button>
                                                    )}
                                                    {item.status === 'กำลังดำเนินการ' && item.assignments?.[0]?.volunteer_id === user?.id && (
                                                        <button
                                                            className="action-btn action-btn-complete"
                                                            onClick={() => handleCompleteCase(item)}
                                                        >
                                                            ช่วยเหลือสำเร็จ
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}

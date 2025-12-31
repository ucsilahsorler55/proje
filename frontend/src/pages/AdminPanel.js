import React, { useState, useEffect } from "react";
import {
    clubApplicationService,
    clubService,
    eventService,
} from "../api/services";
import { useAuth } from "../context/AuthContext";
import "../styles/Admin.css";

const AdminPanel = () => {
    const [pendingClubs, setPendingClubs] = useState([]);
    const [activeClubs, setActiveClubs] = useState([]);
    const [pendingEvents, setPendingEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("applications");
    const [selectedClub, setSelectedClub] = useState(null); // For detail/members modal
    const { user } = useAuth();

    useEffect(() => {
        if (user?.role === "sks_admin") {
            loadData();
        }
    }, [user]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [pendingApps, clubsData, eventsData] = await Promise.all([
                clubApplicationService.getApplications("pending"),
                clubService.getClubs("active"), // Fetch active clubs
                eventService.getEvents(), // Fetch all events, we will filter pending ones
            ]);
            setPendingClubs(pendingApps);
            setActiveClubs(clubsData.clubs);

            // Filter pending events
            const pending = eventsData.events.filter(
                (e) => e.status === "pending"
            );
            setPendingEvents(pending);
        } catch (err) {
            setError("Veriler yüklenirken hata oluştu");
            console.error("Error loading admin data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (e, clubId) => {
        e.preventDefault();
        try {
            await clubApplicationService.reviewApplication(clubId, "approve");
            alert("Kulüp başarıyla onaylandı!");
            loadData();
        } catch (err) {
            console.error(err);
            alert("HATA: " + (err.response?.data?.error || err.message));
        }
    };

    const handleReject = async (e, clubId) => {
        e.preventDefault();
        try {
            await clubApplicationService.reviewApplication(clubId, "reject");
            alert("Kulüp reddedildi");
            loadData();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.error || "Hata oluştu");
        }
    };

    const handleEventApprove = async (e, eventId) => {
        e.preventDefault();
        try {
            await eventService.updateStatus(eventId, "approved");
            alert("Etkinlik onaylandı!");
            loadData();
        } catch (err) {
            console.error(err);
            alert("HATA: " + (err.response?.data?.error || err.message));
        }
    };

    const handleEventReject = async (e, eventId) => {
        e.preventDefault();
        try {
            await eventService.updateStatus(eventId, "rejected");
            alert("Etkinlik reddedildi");
            loadData();
        } catch (err) {
            console.error(err);
            alert("HATA: " + (err.response?.data?.error || err.message));
        }
    };

    const viewClubMembers = async (clubId) => {
        try {
            const data = await clubService.getClub(clubId);
            setSelectedClub(data);
        } catch (err) {
            alert("Kulüp detayları alınamadı");
        }
    };

    if (user?.role !== "sks_admin") {
        return (
            <div className="admin-container">
                <div className="error">Bu sayfaya erişim yetkiniz yok.</div>
            </div>
        );
    }

    if (loading) return <div className="loading">Yükleniyor...</div>;

    return (
        <div className="admin-container">
            <h1>SKS Admin Panel</h1>

            <div className="tabs">
                <button
                    className={`tab ${
                        activeTab === "applications" ? "active" : ""
                    }`}
                    onClick={() => setActiveTab("applications")}
                >
                    Kulüp Başvuruları ({pendingClubs.length})
                </button>
                <button
                    className={`tab ${activeTab === "events" ? "active" : ""}`}
                    onClick={() => setActiveTab("events")}
                >
                    Etkinlik Başvuruları ({pendingEvents.length})
                </button>
                <button
                    className={`tab ${activeTab === "clubs" ? "active" : ""}`}
                    onClick={() => setActiveTab("clubs")}
                >
                    Tüm Kulüpler ({activeClubs.length})
                </button>
            </div>

            {error && <div className="error">{error}</div>}

            {activeTab === "applications" && (
                <div className="admin-section">
                    <h2>Bekleyen Kulüp Başvuruları</h2>
                    {pendingClubs.length === 0 ? (
                        <p className="no-data">
                            Bekleyen kulüp başvurusu bulunmamaktadır.
                        </p>
                    ) : (
                        <div className="applications-list">
                            {pendingClubs.map((app) => (
                                <div key={app.id} className="application-card">
                                    <div className="application-header">
                                        <h3>{app.club_name}</h3>
                                        <span className="status-badge pending">
                                            Beklemede
                                        </span>
                                    </div>

                                    <p className="application-description">
                                        {app.description}
                                    </p>

                                    <div className="application-info">
                                        <div className="info-row">
                                            <strong>Başvuran:</strong>{" "}
                                            {app.applicant_name}
                                        </div>
                                        <div className="info-row">
                                            <strong>Başvuru Tarihi:</strong>{" "}
                                            {new Date(
                                                app.created_at
                                            ).toLocaleDateString("tr-TR")}
                                        </div>
                                        {app.founders &&
                                            app.founders.length > 0 && (
                                                <div className="info-row">
                                                    <strong>
                                                        Kurucu Üyeler:
                                                    </strong>{" "}
                                                    {app.founders
                                                        .map((f) => f.user_name)
                                                        .join(", ")}
                                                </div>
                                            )}
                                    </div>

                                    <div className="application-actions">
                                        <button
                                            type="button"
                                            onClick={(e) =>
                                                handleApprove(e, app.id)
                                            }
                                            className="btn-approve"
                                        >
                                            ✓ Onayla
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) =>
                                                handleReject(e, app.id)
                                            }
                                            className="btn-reject"
                                        >
                                            ✗ Reddet
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === "events" && (
                <div className="admin-section">
                    <h2>Bekleyen Etkinlik Başvuruları</h2>
                    {pendingEvents.length === 0 ? (
                        <p className="no-data">
                            Bekleyen etkinlik başvurusu bulunmamaktadır.
                        </p>
                    ) : (
                        <div className="applications-list">
                            {pendingEvents.map((event) => (
                                <div
                                    key={event.id}
                                    className="application-card"
                                >
                                    <div className="application-header">
                                        <h3>{event.title}</h3>
                                        <span className="status-badge pending">
                                            Beklemede
                                        </span>
                                    </div>

                                    <p>
                                        <strong>Kulüp:</strong>{" "}
                                        {event.club_name}
                                    </p>
                                    <p className="application-description">
                                        {event.description}
                                    </p>

                                    <div className="application-info">
                                        <div className="info-row">
                                            <strong>Tarih:</strong>{" "}
                                            {new Date(
                                                event.event_date
                                            ).toLocaleString("tr-TR")}
                                        </div>
                                        <div className="info-row">
                                            <strong>Konum:</strong>{" "}
                                            {event.location}
                                        </div>
                                        {event.capacity && (
                                            <div className="info-row">
                                                <strong>Kapasite:</strong>{" "}
                                                {event.capacity}
                                            </div>
                                        )}
                                    </div>

                                    <div className="application-actions">
                                        <button
                                            type="button"
                                            onClick={(e) =>
                                                handleEventApprove(e, event.id)
                                            }
                                            className="btn-approve"
                                        >
                                            ✓ Onayla
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) =>
                                                handleEventReject(e, event.id)
                                            }
                                            className="btn-reject"
                                        >
                                            ✗ Reddet
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === "clubs" && (
                <div className="admin-section">
                    <h2>Aktif Kulüpler</h2>
                    <table
                        className="table"
                        style={{
                            width: "100%",
                            marginTop: "10px",
                            borderCollapse: "collapse",
                        }}
                    >
                        <thead>
                            <tr
                                style={{
                                    textAlign: "left",
                                    borderBottom: "2px solid #ddd",
                                }}
                            >
                                <th style={{ padding: "10px" }}>Kulüp Adı</th>
                                <th style={{ padding: "10px" }}>Danışman</th>
                                <th style={{ padding: "10px" }}>Üye Sayısı</th>
                                <th style={{ padding: "10px" }}>İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activeClubs.map((club) => (
                                <tr
                                    key={club.id}
                                    style={{ borderBottom: "1px solid #eee" }}
                                >
                                    <td style={{ padding: "10px" }}>
                                        {club.name}
                                    </td>
                                    <td style={{ padding: "10px" }}>
                                        {club.advisor_name}
                                    </td>
                                    <td style={{ padding: "10px" }}>
                                        {club.member_count}
                                    </td>
                                    <td style={{ padding: "10px" }}>
                                        <button
                                            onClick={() =>
                                                viewClubMembers(club.id)
                                            }
                                            className="btn-secondary"
                                        >
                                            Üyeleri Gör
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {selectedClub && (
                <div
                    className="modal-overlay"
                    onClick={() => setSelectedClub(null)}
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0,0,0,0.5)",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        zIndex: 1000,
                    }}
                >
                    <div
                        className="modal-content"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            backgroundColor: "white",
                            padding: "20px",
                            borderRadius: "8px",
                            maxWidth: "800px",
                            width: "90%",
                            position: "relative",
                            maxHeight: "80vh",
                            overflowY: "auto",
                        }}
                    >
                        <button
                            onClick={() => setSelectedClub(null)}
                            style={{
                                position: "absolute",
                                top: "10px",
                                right: "10px",
                                background: "none",
                                border: "none",
                                fontSize: "1.5rem",
                                cursor: "pointer",
                            }}
                        >
                            &times;
                        </button>
                        <h2>{selectedClub.name} - Üyeler</h2>

                        <table
                            className="table"
                            style={{
                                width: "100%",
                                marginTop: "10px",
                                borderCollapse: "collapse",
                            }}
                        >
                            <thead>
                                <tr
                                    style={{
                                        textAlign: "left",
                                        borderBottom: "2px solid #ddd",
                                    }}
                                >
                                    <th style={{ padding: "10px" }}>
                                        Ad Soyad
                                    </th>
                                    <th style={{ padding: "10px" }}>
                                        Öğrenci No
                                    </th>
                                    <th style={{ padding: "10px" }}>Bölüm</th>
                                    <th style={{ padding: "10px" }}>Rol</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedClub.members &&
                                selectedClub.members.length > 0 ? (
                                    selectedClub.members.map((member) => (
                                        <tr
                                            key={member.id}
                                            style={{
                                                borderBottom: "1px solid #eee",
                                            }}
                                        >
                                            <td style={{ padding: "10px" }}>
                                                {member.first_name}{" "}
                                                {member.last_name}
                                            </td>
                                            <td style={{ padding: "10px" }}>
                                                {member.student_number}
                                            </td>
                                            <td style={{ padding: "10px" }}>
                                                {member.department}
                                            </td>
                                            <td style={{ padding: "10px" }}>
                                                {member.membership_role ||
                                                    member.role}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan="4"
                                            style={{
                                                padding: "20px",
                                                textAlign: "center",
                                            }}
                                        >
                                            Üye bulunamadı.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        <button
                            onClick={() => setSelectedClub(null)}
                            className="btn-primary"
                            style={{ marginTop: "20px", width: "100%" }}
                        >
                            Kapat
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;

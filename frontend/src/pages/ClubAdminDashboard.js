import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { eventService } from "../api/services";
import axios from "axios";
import "../App.css";

const ClubAdminDashboard = () => {
    const { user } = useAuth();
    const [club, setClub] = useState(null);
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) return;

                const clubResponse = await axios.get(
                    "http://localhost:5000/api/clubs/my-club",
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                setClub(clubResponse.data);

                if (clubResponse.data.id) {
                    const eventsResponse = await eventService.getEvents(
                        clubResponse.data.id
                    );
                    setEvents(eventsResponse.events);
                }

                setLoading(false);
            } catch (err) {
                console.error("Veriler alınamadı:", err);
                setError("Bilgiler yüklenirken bir hata oluştu.");
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleViewParticipants = async (eventId) => {
        try {
            const data = await eventService.getParticipants(eventId);
            setParticipants(data.participants);
            const event = events.find((e) => e.id === eventId);
            setSelectedEvent(event);
        } catch (err) {
            alert("Katılımcılar alınamadı");
        }
    };

    if (loading)
        return (
            <div
                className="container"
                style={{ padding: "40px", textAlign: "center" }}
            >
                Yükleniyor...
            </div>
        );

    if (!club)
        return (
            <div
                className="container"
                style={{ padding: "40px", textAlign: "center" }}
            >
                Kulüp bilgisi bulunamadı veya yetkiniz yok.
            </div>
        );

    return (
        <div className="container" style={{ padding: "40px" }}>
            <div
                className="card"
                style={{
                    maxWidth: "1000px",
                    margin: "0 auto",
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        backgroundColor: "#2c3e50",
                        color: "white",
                        padding: "20px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <h2 style={{ margin: 0 }}>{club.name} - Yönetim Paneli</h2>
                    <span
                        className="badge"
                        style={{ backgroundColor: "#e74c3c" }}
                    >
                        Yönetici
                    </span>
                </div>

                <div style={{ padding: "30px" }}>
                    {error && (
                        <div
                            className="alert alert-error"
                            style={{ marginBottom: "20px" }}
                        >
                            {error}
                        </div>
                    )}

                    <div style={{ lineHeight: "1.8" }}>
                        <h3
                            style={{
                                borderBottom: "2px solid #ecf0f1",
                                paddingBottom: "10px",
                                marginBottom: "20px",
                            }}
                        >
                            Kulüp Bilgileri
                        </h3>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "150px 1fr",
                                gap: "15px",
                                marginBottom: "15px",
                            }}
                        >
                            <strong>Kulüp Adı:</strong>
                            <span>{club.name}</span>

                            <strong>Açıklama:</strong>
                            <span>{club.description}</span>

                            <strong>Kuruluş Tarihi:</strong>
                            <span>{club.founding_date || "Belirtilmemiş"}</span>

                            <strong>Kurucu Üye:</strong>
                            <span>{club.founder_name || "Bilinmiyor"}</span>

                            <strong>Danışman:</strong>
                            <span>
                                {club.advisor_name} ({club.advisor_email})
                            </span>

                            <strong>Üye Sayısı:</strong>
                            <span>{club.members?.length || 0}</span>
                        </div>
                    </div>

                    <div
                        className="club-members-section"
                        style={{ marginTop: "30px" }}
                    >
                        <h3
                            style={{
                                borderBottom: "2px solid #ecf0f1",
                                paddingBottom: "10px",
                                marginBottom: "20px",
                            }}
                        >
                            Kulüp Etkinlikleri
                        </h3>
                        {events && events.length > 0 ? (
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
                                            backgroundColor: "#f8f9fa",
                                        }}
                                    >
                                        <th style={{ padding: "12px" }}>
                                            Etkinlik Adı
                                        </th>
                                        <th style={{ padding: "12px" }}>
                                            Tarih
                                        </th>
                                        <th style={{ padding: "12px" }}>
                                            Durum
                                        </th>
                                        <th style={{ padding: "12px" }}>
                                            İşlemler
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {events.map((event) => (
                                        <tr
                                            key={event.id}
                                            style={{
                                                borderBottom: "1px solid #eee",
                                            }}
                                        >
                                            <td style={{ padding: "12px" }}>
                                                {event.title}
                                            </td>
                                            <td style={{ padding: "12px" }}>
                                                {new Date(
                                                    event.event_date
                                                ).toLocaleDateString("tr-TR")}
                                            </td>
                                            <td style={{ padding: "12px" }}>
                                                <span
                                                    className={`badge ${
                                                        event.status ===
                                                        "approved"
                                                            ? "badge-success"
                                                            : event.status ===
                                                              "rejected"
                                                            ? "badge-error"
                                                            : "badge-warning"
                                                    }`}
                                                >
                                                    {event.status === "approved"
                                                        ? "Onaylandı"
                                                        : event.status ===
                                                          "rejected"
                                                        ? "Reddedildi"
                                                        : "Beklemede"}
                                                </span>
                                            </td>
                                            <td style={{ padding: "12px" }}>
                                                <button
                                                    onClick={() =>
                                                        handleViewParticipants(
                                                            event.id
                                                        )
                                                    }
                                                    className="btn-secondary"
                                                    style={{
                                                        fontSize: "0.8rem",
                                                        padding: "5px 10px",
                                                    }}
                                                >
                                                    Katılımcılar
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div
                                style={{
                                    padding: "20px",
                                    backgroundColor: "#f8f9fa",
                                    borderRadius: "8px",
                                    textAlign: "center",
                                    color: "#666",
                                }}
                            >
                                Henüz etkinlik oluşturulmamış.
                            </div>
                        )}
                    </div>

                    <div
                        className="club-members-section"
                        style={{ marginTop: "30px" }}
                    >
                        <h3
                            style={{
                                borderBottom: "2px solid #ecf0f1",
                                paddingBottom: "10px",
                                marginBottom: "20px",
                            }}
                        >
                            Kulüp Üyeleri
                        </h3>
                        {club.members && club.members.length > 0 ? (
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
                                            backgroundColor: "#f8f9fa",
                                        }}
                                    >
                                        <th style={{ padding: "12px" }}>
                                            Ad Soyad
                                        </th>
                                        <th style={{ padding: "12px" }}>
                                            Öğrenci No
                                        </th>
                                        <th style={{ padding: "12px" }}>
                                            Bölüm
                                        </th>
                                        <th style={{ padding: "12px" }}>Rol</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {club.members.map((member) => (
                                        <tr
                                            key={member.id}
                                            style={{
                                                borderBottom: "1px solid #eee",
                                            }}
                                        >
                                            <td style={{ padding: "12px" }}>
                                                {member.first_name}{" "}
                                                {member.last_name}
                                            </td>
                                            <td style={{ padding: "12px" }}>
                                                {member.student_number}
                                            </td>
                                            <td style={{ padding: "12px" }}>
                                                {member.department}
                                            </td>
                                            <td style={{ padding: "12px" }}>
                                                <span
                                                    className={`badge ${
                                                        member.role ===
                                                        "president"
                                                            ? "badge-primary"
                                                            : "badge-secondary"
                                                    }`}
                                                >
                                                    {member.role === "president"
                                                        ? "Başkan"
                                                        : "Üye"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div
                                style={{
                                    padding: "20px",
                                    backgroundColor: "#f8f9fa",
                                    borderRadius: "8px",
                                    textAlign: "center",
                                    color: "#666",
                                }}
                            >
                                Henüz üye bulunmamaktadır.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {selectedEvent && (
                <div
                    className="modal-overlay"
                    onClick={() => setSelectedEvent(null)}
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
                            maxWidth: "600px",
                            width: "90%",
                            position: "relative",
                            maxHeight: "80vh",
                            overflowY: "auto",
                        }}
                    >
                        <button
                            onClick={() => setSelectedEvent(null)}
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
                        <h2>{selectedEvent.title} - Katılımcılar</h2>

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
                                    <th style={{ padding: "10px" }}>
                                        Kayıt Tarihi
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {participants && participants.length > 0 ? (
                                    participants.map((p, index) => (
                                        <tr
                                            key={index}
                                            style={{
                                                borderBottom: "1px solid #eee",
                                            }}
                                        >
                                            <td style={{ padding: "10px" }}>
                                                {p.first_name} {p.last_name}
                                            </td>
                                            <td style={{ padding: "10px" }}>
                                                {p.student_number}
                                            </td>
                                            <td style={{ padding: "10px" }}>
                                                {new Date(
                                                    p.registered_at
                                                ).toLocaleDateString("tr-TR")}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan="3"
                                            style={{
                                                padding: "20px",
                                                textAlign: "center",
                                            }}
                                        >
                                            Katılımcı bulunamadı.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        <button
                            onClick={() => setSelectedEvent(null)}
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

export default ClubAdminDashboard;

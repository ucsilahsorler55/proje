import React, { useState, useEffect } from "react";
import { eventService } from "../api/services";
import { useAuth } from "../context/AuthContext";
import "../styles/Clubs.css"; // Reusing club styles for cards

const EventList = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const { user } = useAuth();

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        try {
            setLoading(true);
            const data = await eventService.getEvents();
            // Filter only approved events
            const approvedEvents = data.events.filter(
                (e) => e.status === "approved"
            );
            setEvents(approvedEvents);
        } catch (err) {
            console.error("Etkinlikler yüklenirken hata:", err);
            setError("Etkinlikler yüklenirken bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (eventId) => {
        try {
            await eventService.registerEvent(eventId);
            alert("Etkinliğe başarıyla kayıt oldunuz!");
            // Opsiyonel: Listeyi yenile veya butonu güncelle
        } catch (err) {
            alert(
                "Kayıt başarısız: " + (err.response?.data?.error || err.message)
            );
        }
    };

    if (loading) return <div className="loading">Yükleniyor...</div>;

    return (
        <div className="container" style={{ padding: "40px" }}>
            <h1
                style={{
                    marginBottom: "30px",
                    borderBottom: "2px solid #ecf0f1",
                    paddingBottom: "10px",
                }}
            >
                Etkinlikler
            </h1>

            {error && <div className="alert alert-error">{error}</div>}

            {events.length === 0 ? (
                <div
                    style={{
                        textAlign: "center",
                        padding: "50px",
                        backgroundColor: "#f8f9fa",
                        borderRadius: "8px",
                        color: "#7f8c8d",
                        fontSize: "1.2rem",
                    }}
                >
                    Henüz etkinlik oluşturulmadı.
                </div>
            ) : (
                <div className="clubs-grid">
                    {" "}
                    {/* Reusing grid layout */}
                    {events.map((event) => (
                        <div key={event.id} className="club-card">
                            <div className="club-header">
                                <h3>{event.title}</h3>
                                <span className="badge badge-success">
                                    Aktif
                                </span>
                            </div>

                            <div className="club-info">
                                <p>
                                    <strong>Kulüp:</strong> {event.club_name}
                                </p>
                                <p>
                                    <strong>Tarih:</strong>{" "}
                                    {new Date(event.event_date).toLocaleString(
                                        "tr-TR"
                                    )}
                                </p>
                                <p>
                                    <strong>Konum:</strong> {event.location}
                                </p>
                                {event.capacity && (
                                    <p>
                                        <strong>Kapasite:</strong>{" "}
                                        {event.capacity}
                                    </p>
                                )}
                            </div>

                            <p
                                style={{
                                    margin: "15px 0",
                                    color: "#555",
                                    lineHeight: "1.5",
                                }}
                            >
                                {event.description.length > 100
                                    ? event.description.substring(0, 100) +
                                      "..."
                                    : event.description}
                            </p>

                            <div className="club-actions">
                                {user?.role === "student" && (
                                    <button
                                        onClick={() => handleRegister(event.id)}
                                        className="btn-primary"
                                        style={{ width: "100%" }}
                                    >
                                        Etkinliğe Katıl
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EventList;

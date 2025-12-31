import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { clubService, eventService } from "../api/services";
import { useAuth } from "../context/AuthContext";
import "../styles/Clubs.css";

const ClubList = () => {
    const [clubs, setClubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [joiningClubId, setJoiningClubId] = useState(null);
    const [selectedClub, setSelectedClub] = useState(null);
    const [viewingMembersClub, setViewingMembersClub] = useState(null); // For Admin Member View
    const [viewingEventsClub, setViewingEventsClub] = useState(null); // For Events View
    const [clubEvents, setClubEvents] = useState([]);
    const { user } = useAuth();

    useEffect(() => {
        loadClubs();
    }, []);

    const loadClubs = async () => {
        try {
            setLoading(true);
            setError("");
            const data = await clubService.getClubs("active");
            setClubs(data.clubs);
        } catch (err) {
            console.error("Kulüpler yükleme hatası:", err);
            setError(
                "Kulüpler yüklenirken hata oluştu: " +
                    (err.response?.data?.error || err.message)
            );
        } finally {
            setLoading(false);
        }
    };

    const handleJoinClub = async (clubId) => {
        try {
            setJoiningClubId(clubId);
            const response = await clubService.joinClub(clubId);
            alert(
                `✅ ${
                    response.message ||
                    "Başvurunuz başarıyla alındı. Onay bekleniyor."
                }`
            );
            loadClubs();
        } catch (err) {
            alert(`❌ ${err.response?.data?.error || "Hata oluştu"}`);
        } finally {
            setJoiningClubId(null);
        }
    };

    const handleShowDetails = (club) => {
        setSelectedClub(club);
    };

    const handleViewMembers = async (clubId) => {
        try {
            const data = await clubService.getClub(clubId);
            setViewingMembersClub(data);
        } catch (err) {
            alert(
                "Üye listesi alınamadı: " +
                    (err.response?.data?.error || err.message)
            );
        }
    };

    const handleViewEvents = async (club) => {
        try {
            const data = await eventService.getEvents(club.id);
            // Filter only approved events for students
            const approvedEvents = data.events.filter(
                (e) => e.status === "approved"
            );
            setClubEvents(approvedEvents);
            setViewingEventsClub(club);
        } catch (err) {
            alert(
                "Etkinlikler alınamadı: " +
                    (err.response?.data?.error || err.message)
            );
        }
    };

    const handleRegisterEvent = async (eventId) => {
        try {
            await eventService.registerEvent(eventId);
            alert("Etkinliğe başarıyla kayıt oldunuz!");
        } catch (err) {
            alert(
                "Kayıt başarısız: " + (err.response?.data?.error || err.message)
            );
        }
    };

    const closeModal = () => {
        setSelectedClub(null);
        setViewingMembersClub(null);
        setViewingEventsClub(null);
    };

    if (loading) return <div className="loading">Yükleniyor...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="clubs-container">
            <div className="clubs-header">
                <h1>🏢 Kulüpler</h1>
                {user?.role === "student" && (
                    <Link
                        to="/create-club-application"
                        className="btn btn-primary"
                    >
                        ✨ Yeni Kulüp Kur
                    </Link>
                )}
            </div>

            <div className="clubs-grid">
                {clubs.length === 0 ? (
                    <div className="empty-clubs">
                        <h3>📭 Henüz aktif kulüp bulunmamaktadır</h3>
                        <p>İlk kulübü siz kurabilirsiniz!</p>
                    </div>
                ) : (
                    clubs.map((club) => (
                        <div key={club.id} className="club-card">
                            <div className="club-header">
                                <h3>{club.name}</h3>
                                <span className="member-count">
                                    {club.member_count || 0} üye
                                </span>
                            </div>

                            <div className="club-info">
                                <p>
                                    <strong>Danışman:</strong>{" "}
                                    {club.advisor_name}
                                </p>
                                <p>
                                    <strong>Durum:</strong>{" "}
                                    {club.status === "active"
                                        ? "Aktif"
                                        : "Beklemede"}
                                </p>
                            </div>

                            <div className="club-actions">
                                <button
                                    onClick={() => handleShowDetails(club)}
                                    className="btn btn-secondary"
                                >
                                    📋 Detaylar
                                </button>

                                <button
                                    onClick={() => handleViewEvents(club)}
                                    className="btn btn-primary"
                                >
                                    🎪 Etkinlikler
                                </button>

                                {user?.role === "student" && (
                                    <button
                                        onClick={() => handleJoinClub(club.id)}
                                        className="btn btn-success"
                                        disabled={joiningClubId === club.id}
                                    >
                                        {joiningClubId === club.id
                                            ? "⏳ İşleniyor..."
                                            : "✨ Katıl"}
                                    </button>
                                )}

                                {user?.role === "sks_admin" && (
                                    <button
                                        onClick={() =>
                                            handleViewMembers(club.id)
                                        }
                                        className="btn btn-secondary"
                                    >
                                        👥 Üyeler
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Detail Modal */}
            {selectedClub && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div
                        className="modal-content"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button onClick={closeModal} className="modal-close">
                            ×
                        </button>
                        <h2>🏢 {selectedClub.name}</h2>
                        <div className="modal-body">
                            <p className="modal-description">
                                {selectedClub.description}
                            </p>
                            <div className="modal-info">
                                <p>
                                    <span>📅 Kuruluş:</span>{" "}
                                    {new Date(
                                        selectedClub.created_at
                                    ).toLocaleDateString("tr-TR")}
                                </p>
                                <p>
                                    <span>👨‍🏫 Danışman:</span>{" "}
                                    {selectedClub.advisor_name}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={closeModal}
                            className="btn btn-primary modal-btn"
                        >
                            Kapat
                        </button>
                    </div>
                </div>
            )}

            {/* Members Modal for Admin */}
            {viewingMembersClub && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div
                        className="modal-content modal-large"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button onClick={closeModal} className="modal-close">
                            ×
                        </button>
                        <h2>👥 {viewingMembersClub.name} - Üye Listesi</h2>

                        <div className="modal-table-wrapper">
                            <table className="modal-table">
                                <thead>
                                    <tr>
                                        <th>Ad Soyad</th>
                                        <th>Öğrenci No</th>
                                        <th>Bölüm</th>
                                        <th>Rol</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {viewingMembersClub.members &&
                                    viewingMembersClub.members.length > 0 ? (
                                        viewingMembersClub.members.map(
                                            (member) => (
                                                <tr key={member.id}>
                                                    <td>
                                                        {member.first_name}{" "}
                                                        {member.last_name}
                                                    </td>
                                                    <td>
                                                        {member.student_number}
                                                    </td>
                                                    <td>{member.department}</td>
                                                    <td>
                                                        {member.membership_role ||
                                                            member.role}
                                                    </td>
                                                </tr>
                                            )
                                        )
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan="4"
                                                className="empty-row"
                                            >
                                                Üye bulunamadı.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <button
                            onClick={closeModal}
                            className="btn btn-primary modal-btn"
                        >
                            Kapat
                        </button>
                    </div>
                </div>
            )}

            {/* Events Modal */}
            {viewingEventsClub && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div
                        className="modal-content modal-large"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button onClick={closeModal} className="modal-close">
                            ×
                        </button>
                        <h2>🎪 {viewingEventsClub.name} - Etkinlikler</h2>

                        {clubEvents.length > 0 ? (
                            <div className="events-list">
                                {clubEvents.map((event) => (
                                    <div key={event.id} className="event-card">
                                        <h3>{event.title}</h3>
                                        <p className="event-desc">
                                            {event.description}
                                        </p>
                                        <div className="event-meta">
                                            <span>
                                                📅{" "}
                                                {new Date(
                                                    event.event_date
                                                ).toLocaleString("tr-TR")}
                                            </span>
                                            <span>📍 {event.location}</span>
                                        </div>
                                        {user?.role === "student" && (
                                            <button
                                                onClick={() =>
                                                    handleRegisterEvent(
                                                        event.id
                                                    )
                                                }
                                                className="btn btn-success"
                                            >
                                                ✨ Etkinliğe Kayıt Ol
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-events">
                                📭 Bu kulübe ait aktif etkinlik bulunmamaktadır.
                            </div>
                        )}

                        <button
                            onClick={closeModal}
                            className="btn btn-primary modal-btn"
                        >
                            Kapat
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClubList;

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { eventService } from "../api/services";

const CreateEvent = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [club, setClub] = useState(null);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [modalInfo, setModalInfo] = useState({
        show: false,
        type: "",
        message: "",
    });

    // Event Form State
    const [eventForm, setEventForm] = useState({
        title: "",
        description: "",
        event_date: "",
        location: "",
        capacity: "",
    });

    // Davet için state'ler
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [createdEventId, setCreatedEventId] = useState(null);

    useEffect(() => {
        const fetchClubDetails = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) return;

                const response = await axios.get(
                    "http://localhost:5000/api/clubs/my-club",
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                setClub(response.data);
                setLoading(false);
            } catch (err) {
                console.error("Kulüp bilgileri alınamadı:", err);
                setModalInfo({
                    show: true,
                    type: "error",
                    message: "Kulüp bilgileri yüklenirken bir hata oluştu.",
                });
                setLoading(false);
            }
        };

        fetchClubDetails();
    }, []);

    const handleEventSubmit = async (e) => {
        e.preventDefault();

        if (!club) return;

        try {
            const token = localStorage.getItem("token");
            const payload = {
                ...eventForm,
                club_id: club.id,
                event_date: new Date(eventForm.event_date).toISOString(),
            };

            const response = await axios.post(
                "http://localhost:5000/api/events/",
                payload,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            setModalInfo({
                show: true,
                type: "success",
                message:
                    "Etkinlik başarıyla oluşturuldu ve yönetici onayına gönderildi.",
            });

            // Etkinlik ID'sini kaydet (davet için)
            if (response && response.data && response.data.event) {
                setCreatedEventId(response.data.event.id);
            }

            setEventForm({
                title: "",
                description: "",
                event_date: "",
                location: "",
                capacity: "",
            });
        } catch (err) {
            console.error("Etkinlik oluşturma hatası:", err);
            setModalInfo({
                show: true,
                type: "error",
                message:
                    err.response?.data?.error ||
                    "Etkinlik oluşturulurken bir hata oluştu.",
            });
        }
    };

    // Öğrenci arama
    const handleSearchUsers = async (query) => {
        setSearchQuery(query);
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }
        try {
            const data = await eventService.searchUsersForInvite(query);
            setSearchResults(data.users || []);
        } catch (err) {
            console.error("Arama hatası:", err);
        }
    };

    // Kullanıcı seçme
    const handleSelectUser = (user) => {
        if (!selectedUsers.find((u) => u.id === user.id)) {
            setSelectedUsers([...selectedUsers, user]);
        }
        setSearchQuery("");
        setSearchResults([]);
    };

    // Seçili kullanıcıyı kaldır
    const handleRemoveUser = (userId) => {
        setSelectedUsers(selectedUsers.filter((u) => u.id !== userId));
    };

    // Davetleri gönder
    const handleSendInvitations = async () => {
        if (!createdEventId || selectedUsers.length === 0) {
            setModalInfo({
                show: true,
                type: "error",
                message:
                    "Önce etkinlik oluşturun ve davet edilecek kişileri seçin.",
            });
            return;
        }
        try {
            const userIds = selectedUsers.map((u) => u.id);
            await eventService.inviteToEvent(createdEventId, userIds);
            setModalInfo({
                show: true,
                type: "success",
                message: `${selectedUsers.length} kişiye davet gönderildi.`,
            });
            setSelectedUsers([]);
            setCreatedEventId(null);
        } catch (err) {
            setModalInfo({
                show: true,
                type: "error",
                message:
                    err.response?.data?.error ||
                    "Davet gönderilirken hata oluştu.",
            });
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEventForm((prev) => ({
            ...prev,
            [name]: value,
        }));
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
                style={{ maxWidth: "800px", margin: "0 auto" }}
            >
                <h2
                    style={{
                        borderBottom: "2px solid #ecf0f1",
                        paddingBottom: "10px",
                        marginBottom: "20px",
                    }}
                >
                    Etkinlik Başvurusu
                </h2>

                <p style={{ color: "#7f8c8d", marginBottom: "20px" }}>
                    Oluşturduğunuz etkinlikler SKS onayı alındıktan sonra
                    yayınlanacaktır.
                </p>

                <form onSubmit={handleEventSubmit}>
                    <div className="form-group">
                        <label>Etkinlik Adı:</label>
                        <input
                            type="text"
                            name="title"
                            className="form-control"
                            value={eventForm.title}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Açıklama:</label>
                        <textarea
                            name="description"
                            className="form-control"
                            rows="4"
                            value={eventForm.description}
                            onChange={handleInputChange}
                            required
                        ></textarea>
                    </div>

                    <div className="form-group">
                        <label>Tarih ve Saat:</label>
                        <input
                            type="datetime-local"
                            name="event_date"
                            className="form-control"
                            value={eventForm.event_date}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Mekan:</label>
                        <input
                            type="text"
                            name="location"
                            className="form-control"
                            value={eventForm.location}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Kontenjan (Opsiyonel):</label>
                        <input
                            type="number"
                            name="capacity"
                            className="form-control"
                            value={eventForm.capacity}
                            onChange={handleInputChange}
                            min="1"
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: "100%", marginTop: "10px" }}
                    >
                        Onaya Gönder
                    </button>
                </form>

                {/* Öğrenci Davet Bölümü */}
                {createdEventId && (
                    <div
                        style={{
                            marginTop: "30px",
                            padding: "20px",
                            backgroundColor: "#f8f9fa",
                            borderRadius: "8px",
                        }}
                    >
                        <h3
                            style={{
                                marginBottom: "15px",
                                borderBottom: "1px solid #ddd",
                                paddingBottom: "10px",
                            }}
                        >
                            Öğrenci Davet Et (Opsiyonel)
                        </h3>
                        <p
                            style={{
                                color: "#7f8c8d",
                                marginBottom: "15px",
                                fontSize: "0.9rem",
                            }}
                        >
                            Etkinliğinize öğrencileri davet edebilirsiniz. SKS
                            onayı sonrası davet ettikleriniz bilgilendirilecek.
                        </p>

                        <div className="form-group">
                            <label>
                                Öğrenci Ara (İsim, Email veya Numara):
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                value={searchQuery}
                                onChange={(e) =>
                                    handleSearchUsers(e.target.value)
                                }
                                placeholder="En az 2 karakter yazın..."
                            />
                        </div>

                        {searchResults.length > 0 && (
                            <div
                                style={{
                                    border: "1px solid #ddd",
                                    borderRadius: "4px",
                                    maxHeight: "200px",
                                    overflowY: "auto",
                                    marginBottom: "15px",
                                }}
                            >
                                {searchResults.map((u) => (
                                    <div
                                        key={u.id}
                                        onClick={() => handleSelectUser(u)}
                                        style={{
                                            padding: "10px",
                                            cursor: "pointer",
                                            borderBottom: "1px solid #eee",
                                            backgroundColor: "white",
                                        }}
                                        onMouseOver={(e) =>
                                            (e.target.style.backgroundColor =
                                                "#f0f0f0")
                                        }
                                        onMouseOut={(e) =>
                                            (e.target.style.backgroundColor =
                                                "white")
                                        }
                                    >
                                        <strong>{u.name}</strong> - {u.email} (
                                        {u.student_number})
                                    </div>
                                ))}
                            </div>
                        )}

                        {selectedUsers.length > 0 && (
                            <div style={{ marginBottom: "15px" }}>
                                <strong>Seçili Öğrenciler:</strong>
                                <div
                                    style={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap: "8px",
                                        marginTop: "10px",
                                    }}
                                >
                                    {selectedUsers.map((u) => (
                                        <span
                                            key={u.id}
                                            style={{
                                                backgroundColor: "#3498db",
                                                color: "white",
                                                padding: "5px 10px",
                                                borderRadius: "20px",
                                                fontSize: "0.9rem",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "5px",
                                            }}
                                        >
                                            {u.name}
                                            <button
                                                onClick={() =>
                                                    handleRemoveUser(u.id)
                                                }
                                                style={{
                                                    background: "none",
                                                    border: "none",
                                                    color: "white",
                                                    cursor: "pointer",
                                                    fontSize: "1rem",
                                                    padding: "0",
                                                }}
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={handleSendInvitations}
                            className="btn btn-primary"
                            style={{
                                width: "100%",
                                backgroundColor: "#27ae60",
                            }}
                            disabled={selectedUsers.length === 0}
                        >
                            {selectedUsers.length > 0
                                ? `${selectedUsers.length} Kişiyi Davet Et`
                                : "Davet Edilecek Kişi Seçin"}
                        </button>
                    </div>
                )}
            </div>

            {/* Modal */}
            {modalInfo.show && (
                <div
                    className="modal-overlay"
                    onClick={() => setModalInfo({ ...modalInfo, show: false })}
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
                            padding: "30px",
                            borderRadius: "8px",
                            maxWidth: "400px",
                            width: "90%",
                            textAlign: "center",
                            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                        }}
                    >
                        <div style={{ fontSize: "3rem", marginBottom: "15px" }}>
                            {modalInfo.type === "success" ? "✅" : "❌"}
                        </div>
                        <h3
                            style={{
                                marginBottom: "15px",
                                color:
                                    modalInfo.type === "success"
                                        ? "#2ecc71"
                                        : "#e74c3c",
                            }}
                        >
                            {modalInfo.type === "success"
                                ? "Başarılı!"
                                : "Hata!"}
                        </h3>
                        <p style={{ marginBottom: "20px", color: "#555" }}>
                            {modalInfo.message}
                        </p>
                        <button
                            onClick={() =>
                                setModalInfo({ ...modalInfo, show: false })
                            }
                            className="btn-primary"
                            style={{ width: "100%" }}
                        >
                            Tamam
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreateEvent;

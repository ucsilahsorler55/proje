import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const CreateEvent = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [club, setClub] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    // Event Form State
    const [eventForm, setEventForm] = useState({
        title: '',
        description: '',
        event_date: '',
        location: '',
        capacity: ''
    });

    useEffect(() => {
        const fetchClubDetails = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const response = await axios.get('http://localhost:5000/api/clubs/my-club', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setClub(response.data);
                setLoading(false);
            } catch (err) {
                console.error("Kulüp bilgileri alınamadı:", err);
                setError('Kulüp bilgileri yüklenirken bir hata oluştu.');
                setLoading(false);
            }
        };

        fetchClubDetails();
    }, []);

    const handleEventSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage('');

        if (!club) return;

        try {
            const token = localStorage.getItem('token');
            const payload = {
                ...eventForm,
                club_id: club.id,
                event_date: new Date(eventForm.event_date).toISOString()
            };

            await axios.post('http://localhost:5000/api/events/', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSuccessMessage('Etkinlik başarıyla oluşturuldu ve yönetici onayına gönderildi.');
            setEventForm({
                title: '',
                description: '',
                event_date: '',
                location: '',
                capacity: ''
            });

            // Optional: Redirect after success
            // setTimeout(() => navigate('/profile'), 2000);
        } catch (err) {
            console.error("Etkinlik oluşturma hatası:", err);
            setError(err.response?.data?.error || 'Etkinlik oluşturulurken bir hata oluştu.');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEventForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    if (loading) return <div className="container" style={{ padding: '40px', textAlign: 'center' }}>Yükleniyor...</div>;
    if (!club) return <div className="container" style={{ padding: '40px', textAlign: 'center' }}>Kulüp bilgisi bulunamadı veya yetkiniz yok.</div>;

    return (
        <div className="container" style={{ padding: '40px' }}>
            <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <h2 style={{ borderBottom: '2px solid #ecf0f1', paddingBottom: '10px', marginBottom: '20px' }}>Etkinlik Başvurusu</h2>

                {error && <div className="alert alert-error" style={{ marginBottom: '20px' }}>{error}</div>}
                {successMessage && <div className="alert alert-success" style={{ marginBottom: '20px' }}>{successMessage}</div>}

                <p style={{ color: '#7f8c8d', marginBottom: '20px' }}>
                    Oluşturduğunuz etkinlikler SKS onayı alındıktan sonra yayınlanacaktır.
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

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
                        Onaya Gönder
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreateEvent;

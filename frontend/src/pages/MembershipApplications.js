import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const MembershipApplications = () => {
    const { user } = useAuth();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/clubs/my-club/applications', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setApplications(response.data);
            setLoading(false);
        } catch (err) {
            console.error("Başvurular yüklenemedi:", err);
            setError('Başvurular yüklenirken bir hata oluştu.');
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`http://localhost:5000/api/clubs/applications/${id}/approve`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccessMessage('Başvuru onaylandı.');
            fetchApplications(); // Refresh list
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            console.error("Onaylama hatası:", err);
            alert('İşlem başarısız oldu.');
        }
    };

    const handleReject = async (id) => {
        if (!window.confirm('Bu başvuruyu reddetmek istediğinize emin misiniz?')) return;

        try {
            const token = localStorage.getItem('token');
            await axios.post(`http://localhost:5000/api/clubs/applications/${id}/reject`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccessMessage('Başvuru reddedildi.');
            fetchApplications(); // Refresh list
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            console.error("Reddetme hatası:", err);
            alert('İşlem başarısız oldu.');
        }
    };

    if (loading) return <div className="container" style={{ padding: '40px', textAlign: 'center' }}>Yükleniyor...</div>;

    return (
        <div className="container" style={{ padding: '40px' }}>
            <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <h2 style={{ borderBottom: '2px solid #ecf0f1', paddingBottom: '10px', marginBottom: '20px' }}>Üyelik Başvuruları</h2>

                {error && <div className="alert alert-error" style={{ marginBottom: '20px' }}>{error}</div>}
                {successMessage && <div className="alert alert-success" style={{ marginBottom: '20px' }}>{successMessage}</div>}

                {applications.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#7f8c8d' }}>Bekleyen başvuru bulunmamaktadır.</p>
                ) : (
                    <div className="application-list">
                        {applications.map((app) => (
                            <div key={app.id} style={{
                                padding: '15px',
                                borderBottom: '1px solid #eee',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div>
                                    <h4 style={{ margin: '0 0 5px 0' }}>{app.user.first_name} {app.user.last_name}</h4>
                                    <p style={{ margin: 0, fontSize: '0.9em', color: '#666' }}>
                                        {app.user.email} - {app.user.department}
                                    </p>
                                    <small style={{ color: '#999' }}>Başvuru: {new Date(app.applied_at).toLocaleDateString()}</small>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        onClick={() => handleApprove(app.id)}
                                        className="btn btn-primary"
                                        style={{ padding: '5px 15px', fontSize: '0.9em' }}
                                    >
                                        Onayla
                                    </button>
                                    <button
                                        onClick={() => handleReject(app.id)}
                                        className="btn"
                                        style={{
                                            padding: '5px 15px',
                                            fontSize: '0.9em',
                                            backgroundColor: '#e74c3c',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Reddet
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MembershipApplications;

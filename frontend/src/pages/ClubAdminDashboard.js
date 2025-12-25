import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import '../App.css';

const ClubAdminDashboard = () => {
    const { user } = useAuth();
    const [club, setClub] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

    if (loading) return <div className="container" style={{ padding: '40px', textAlign: 'center' }}>Yükleniyor...</div>;

    if (!club) return <div className="container" style={{ padding: '40px', textAlign: 'center' }}>Kulüp bilgisi bulunamadı veya yetkiniz yok.</div>;

    return (
        <div className="container" style={{ padding: '40px' }}>
            <div className="card" style={{ maxWidth: '1000px', margin: '0 auto', overflow: 'hidden' }}>
                <div style={{
                    backgroundColor: '#2c3e50',
                    color: 'white',
                    padding: '20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h2 style={{ margin: 0 }}>{club.name} - Yönetim Paneli</h2>
                    <span className="badge" style={{ backgroundColor: '#e74c3c' }}>Yönetici</span>
                </div>

                <div style={{ padding: '30px' }}>
                    {error && <div className="alert alert-error" style={{ marginBottom: '20px' }}>{error}</div>}

                    <div style={{ lineHeight: '1.8' }}>
                        <h3 style={{ borderBottom: '2px solid #ecf0f1', paddingBottom: '10px', marginBottom: '20px' }}>Kulüp Bilgileri</h3>

                        <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '15px', marginBottom: '15px' }}>
                            <strong>Kulüp Adı:</strong>
                            <span>{club.name}</span>

                            <strong>Açıklama:</strong>
                            <span>{club.description}</span>

                            <strong>Kuruluş Tarihi:</strong>
                            <span>{club.founding_date || 'Belirtilmemiş'}</span>

                            <strong>Kurucu Üye:</strong>
                            <span>{club.founder_name || 'Bilinmiyor'}</span>

                            <strong>Danışman:</strong>
                            <span>{club.advisor_name} ({club.advisor_email})</span>

                            <strong>Üye Sayısı:</strong>
                            <span>{club.members?.length || 0}</span>
                        </div>
                    </div>

                    <div className="club-members-section" style={{ marginTop: '30px' }}>
                        <h3 style={{ borderBottom: '2px solid #ecf0f1', paddingBottom: '10px', marginBottom: '20px' }}>Kulüp Üyeleri</h3>
                        {club.members && club.members.length > 0 ? (
                            <table className="table" style={{ width: '100%', marginTop: '10px', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '2px solid #ddd', backgroundColor: '#f8f9fa' }}>
                                        <th style={{ padding: '12px' }}>Ad Soyad</th>
                                        <th style={{ padding: '12px' }}>Öğrenci No</th>
                                        <th style={{ padding: '12px' }}>Bölüm</th>
                                        <th style={{ padding: '12px' }}>Rol</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {club.members.map(member => (
                                        <tr key={member.id} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '12px' }}>{member.first_name} {member.last_name}</td>
                                            <td style={{ padding: '12px' }}>{member.student_number}</td>
                                            <td style={{ padding: '12px' }}>{member.department}</td>
                                            <td style={{ padding: '12px' }}>
                                                <span className={`badge ${member.role === 'president' ? 'badge-primary' : 'badge-secondary'}`}>
                                                    {member.role === 'president' ? 'Başkan' : 'Üye'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', textAlign: 'center', color: '#666' }}>
                                Henüz üye bulunmamaktadır.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClubAdminDashboard;

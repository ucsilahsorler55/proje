import React, { useState, useEffect } from 'react';
import { userService } from '../api/services';
import '../styles/Navbar.css'; // Using Navbar styles for consistency or creates new if needed

const Profile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const data = await userService.getProfile();
            setProfile(data);
        } catch (err) {
            setError('Profil yüklenirken bir hata oluştu');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading">Yükleniyor...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="container" style={{ padding: '40px' }}>
            <div className="card" style={{ maxWidth: '600px', margin: '0 auto', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', borderRadius: '8px' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid #eee', backgroundColor: '#f8f9fa', borderRadius: '8px 8px 0 0' }}>
                    <h2 style={{ margin: 0 }}>Profilim</h2>
                </div>

                <div style={{ padding: '20px' }}>
                    <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#3498db', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '2rem', marginRight: '20px' }}>
                            {profile.first_name?.charAt(0)}{profile.last_name?.charAt(0)}
                        </div>
                        <div>
                            <h3 style={{ margin: 0 }}>{profile.first_name} {profile.last_name}</h3>
                            <span className="badge badge-primary">{profile.role === 'student' ? 'Öğrenci' : profile.role}</span>
                        </div>
                    </div>

                    <div className="profile-details">
                        <div style={{ marginBottom: '15px' }}>
                            <strong>E-posta:</strong>
                            <p style={{ margin: '5px 0', color: '#555' }}>{profile.email}</p>
                        </div>

                        {profile.student_number && (
                            <div style={{ marginBottom: '15px' }}>
                                <strong>Öğrenci Numarası:</strong>
                                <p style={{ margin: '5px 0', color: '#555' }}>{profile.student_number}</p>
                            </div>
                        )}

                        {profile.department && (
                            <div style={{ marginBottom: '15px' }}>
                                <strong>Bölüm:</strong>
                                <p style={{ margin: '5px 0', color: '#555' }}>{profile.department}</p>
                            </div>
                        )}

                        {profile.phone && (
                            <div style={{ marginBottom: '15px' }}>
                                <strong>Telefon:</strong>
                                <p style={{ margin: '5px 0', color: '#555' }}>{profile.phone}</p>
                            </div>
                        )}

                        <div style={{ marginBottom: '15px' }}>
                            <strong>Kayıt Tarihi:</strong>
                            <p style={{ margin: '5px 0', color: '#555' }}>
                                {new Date(profile.created_at).toLocaleDateString('tr-TR')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;

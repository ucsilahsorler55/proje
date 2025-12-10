import React from 'react';
import { useAuth } from '../context/AuthContext';
import '../App.css'; // Global stiller

const ClubAdminDashboard = () => {
    const { user } = useAuth();

    return (
        <div className="container" style={{ padding: '40px', textAlign: 'center' }}>
            <div className="card" style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
                <h1 style={{ color: '#2c3e50', marginBottom: '20px' }}>Hoş Geldiniz</h1>

                <div style={{ fontSize: '18px', lineHeight: '1.6' }}>
                    <p>Sayın <strong>{user?.name || 'Kulüp Yöneticisi'}</strong>,</p>
                    <p>
                        Kulüp Yönetim Ekranına başarıyla giriş yaptınız.
                    </p>
                    <p>
                        Sol üstteki menüden <strong>"Etkinlikler"</strong> sekmesine giderek
                        kulübünüz için yeni etkinlikler oluşturabilir ve mevcut etkinlikleri yönetebilirsiniz.
                    </p>
                    <p style={{ marginTop: '20px', color: '#7f8c8d' }}>
                        Daha fazla yönetim özelliği yakında eklenecektir.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ClubAdminDashboard;

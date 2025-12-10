import React, { useState, useEffect } from 'react';
import { userService } from '../api/services';
import '../styles/Navbar.css'; // Stil için

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        try {
            const data = await userService.getNotifications();
            setNotifications(data);
        } catch (error) {
            console.error('Bildirimler yüklenemedi', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading">Yükleniyor...</div>;

    return (
        <div className="container" style={{ padding: '20px' }}>
            <h2>Bildirimler</h2>
            {notifications.length === 0 ? (
                <p>Henüz bildiriminiz yok.</p>
            ) : (
                <div className="notifications-list">
                    {notifications.map(n => (
                        <div key={n.id} className="card mb-3">
                            <div className="card-body">
                                <h5 className="card-title">{n.title}</h5>
                                <p className="card-text" style={{ whiteSpace: 'pre-wrap' }}>{n.message}</p>
                                <small className="text-muted">
                                    {new Date(n.created_at).toLocaleString('tr-TR')}
                                </small>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Notifications;

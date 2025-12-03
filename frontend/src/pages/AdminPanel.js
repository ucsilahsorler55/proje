import React, { useState, useEffect } from 'react';
import { clubService } from '../api/services';
import { useAuth } from '../context/AuthContext';
import '../styles/Admin.css';

const AdminPanel = () => {
  const [pendingClubs, setPendingClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role === 'sks_admin') {
      loadPendingClubs();
    }
  }, [user]);

  const loadPendingClubs = async () => {
    try {
      setLoading(true);
      const data = await clubService.getClubs('pending');
      setPendingClubs(data.clubs);
    } catch (err) {
      setError('Başvurular yüklenirken hata oluştu');
      console.error('Error loading pending clubs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (clubId) => {
    if (!window.confirm('Bu kulübü onaylamak istediğinizden emin misiniz?')) {
      return;
    }

    try {
      await clubService.approveClub(clubId);
      alert('Kulüp başarıyla onaylandı!');
      loadPendingClubs();
    } catch (err) {
      alert(err.response?.data?.error || 'Kulüp onaylanırken hata oluştu');
    }
  };

  const handleReject = async (clubId) => {
    if (!window.confirm('Bu kulübü reddetmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      await clubService.rejectClub(clubId);
      alert('Kulüp reddedildi');
      loadPendingClubs();
    } catch (err) {
      alert(err.response?.data?.error || 'Kulüp reddedilirken hata oluştu');
    }
  };

  if (user?.role !== 'sks_admin') {
    return (
      <div className="admin-container">
        <div className="error">Bu sayfaya erişim yetkiniz yok.</div>
      </div>
    );
  }

  if (loading) return <div className="loading">Yükleniyor...</div>;

  return (
    <div className="admin-container">
      <h1>SKS Admin Panel</h1>

      <div className="admin-section">
        <h2>Bekleyen Kulüp Başvuruları ({pendingClubs.length})</h2>
        
        {error && <div className="error">{error}</div>}

        {pendingClubs.length === 0 ? (
          <p className="no-data">Bekleyen kulüp başvurusu bulunmamaktadır.</p>
        ) : (
          <div className="applications-list">
            {pendingClubs.map((club) => (
              <div key={club.id} className="application-card">
                <div className="application-header">
                  <h3>{club.name}</h3>
                  <span className="status-badge pending">Beklemede</span>
                </div>
                
                <p className="application-description">{club.description}</p>
                
                <div className="application-info">
                  <div className="info-row">
                    <strong>Danışman:</strong> {club.advisor_name}
                  </div>
                  <div className="info-row">
                    <strong>Email:</strong> {club.advisor_email}
                  </div>
                  <div className="info-row">
                    <strong>Başvuru Tarihi:</strong> {new Date(club.created_at).toLocaleDateString('tr-TR')}
                  </div>
                </div>

                <div className="application-actions">
                  <button
                    onClick={() => handleApprove(club.id)}
                    className="btn-approve"
                  >
                    ✓ Onayla
                  </button>
                  <button
                    onClick={() => handleReject(club.id)}
                    className="btn-reject"
                  >
                    ✗ Reddet
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="admin-section">
        <h2>Diğer İşlemler</h2>
        <p className="no-data">Etkinlik onaylama ve kullanıcı yönetimi özellikleri yakında eklenecek...</p>
      </div>
    </div>
  );
};

export default AdminPanel;

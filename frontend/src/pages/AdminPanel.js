import React, { useState, useEffect } from 'react';
import { clubApplicationService } from '../api/services';
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
      const data = await clubApplicationService.getApplications('pending');
      setPendingClubs(data);
    } catch (err) {
      setError('Başvurular yüklenirken hata oluştu');
      console.error('Error loading pending clubs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (e, clubId) => {
    e.preventDefault();
    // Direkt onaylama
    try {
      await clubApplicationService.reviewApplication(clubId, 'approve');
      alert('Kulüp başarıyla onaylandı!');
      loadPendingClubs();
    } catch (err) {
      console.error(err);
      alert('HATA: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleReject = async (e, clubId) => {
    e.preventDefault();
    // Direkt reddetme
    try {
      await clubApplicationService.reviewApplication(clubId, 'reject');
      alert('Kulüp reddedildi');
      loadPendingClubs();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Hata oluştu');
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
            {pendingClubs.map((app) => (
              <div key={app.id} className="application-card">
                <div className="application-header">
                  <h3>{app.club_name}</h3>
                  <span className="status-badge pending">Beklemede</span>
                </div>

                <p className="application-description">{app.description}</p>

                <div className="application-info">
                  <div className="info-row">
                    <strong>Başvuran:</strong> {app.applicant_name}
                  </div>
                  <div className="info-row">
                    <strong>Başvuru Tarihi:</strong> {new Date(app.created_at).toLocaleDateString('tr-TR')}
                  </div>
                  {app.founders && app.founders.length > 0 && (
                    <div className="info-row">
                      <strong>Kurucu Üyeler:</strong> {app.founders.map(f => f.user_name).join(', ')}
                    </div>
                  )}
                </div>

                <div className="application-actions">
                  <button
                    type="button"
                    onClick={(e) => handleApprove(e, app.id)}
                    className="btn-approve"
                  >
                    ✓ Onayla
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleReject(e, app.id)}
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

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { clubApplicationService } from '../api/services';
import '../styles/ClubApplication.css';

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('applications');
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [apps, invs] = await Promise.all([
        clubApplicationService.getApplications('all'),
        clubApplicationService.getMyInvitations()
      ]);
      setApplications(apps);
      setInvitations(invs);
    } catch (err) {
      setError('Veriler yüklenirken bir hata oluştu');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvitationResponse = async (founderId, action) => {
    try {
      await clubApplicationService.respondToInvitation(founderId, action);
      // Listeyi güncelle
      setInvitations(invitations.map(inv => 
        inv.id === founderId 
          ? { ...inv, status: action === 'accept' ? 'accepted' : 'rejected' }
          : inv
      ));
    } catch (err) {
      setError('İşlem sırasında bir hata oluştu');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { text: 'Beklemede', class: 'badge-warning' },
      approved: { text: 'Onaylandı', class: 'badge-success' },
      rejected: { text: 'Reddedildi', class: 'badge-danger' },
      accepted: { text: 'Kabul Edildi', class: 'badge-success' }
    };
    const badge = badges[status] || { text: status, class: 'badge-secondary' };
    return <span className={`badge ${badge.class}`}>{badge.text}</span>;
  };

  if (loading) {
    return <div className="loading">Yükleniyor...</div>;
  }

  return (
    <div className="my-applications-container">
      <div className="page-header">
        <h2>Kulüp Başvurularım</h2>
        <Link to="/create-club-application" className="btn btn-primary">
          + Yeni Başvuru
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'applications' ? 'active' : ''}`}
          onClick={() => setActiveTab('applications')}
        >
          Başvurularım ({applications.length})
        </button>
        <button 
          className={`tab ${activeTab === 'invitations' ? 'active' : ''}`}
          onClick={() => setActiveTab('invitations')}
        >
          Gelen Davetler ({invitations.filter(i => i.status === 'pending').length})
        </button>
      </div>

      {activeTab === 'applications' && (
        <div className="applications-list">
          {applications.length === 0 ? (
            <div className="empty-state">
              <p>Henüz bir başvurunuz yok.</p>
              <Link to="/create-club-application" className="btn btn-primary">
                İlk Başvurunuzu Oluşturun
              </Link>
            </div>
          ) : (
            applications.map(app => (
              <div key={app.id} className="application-item">
                <div className="application-header">
                  <h3>{app.club_name}</h3>
                  {getStatusBadge(app.status)}
                </div>
                <p className="application-description">{app.description}</p>
                <div className="application-meta">
                  <span>Başvuru Tarihi: {new Date(app.created_at).toLocaleDateString('tr-TR')}</span>
                  {app.founders && app.founders.length > 0 && (
                    <span>Kurucu Üyeler: {app.founders.length} kişi</span>
                  )}
                </div>
                {app.status === 'rejected' && app.rejection_reason && (
                  <div className="rejection-reason">
                    <strong>Red Sebebi:</strong> {app.rejection_reason}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'invitations' && (
        <div className="invitations-list">
          {invitations.length === 0 ? (
            <div className="empty-state">
              <p>Henüz bir davetiniz yok.</p>
            </div>
          ) : (
            invitations.map(inv => (
              <div key={inv.id} className="invitation-item">
                <div className="invitation-header">
                  <h3>{inv.application?.club_name}</h3>
                  {getStatusBadge(inv.status)}
                </div>
                <p className="invitation-description">{inv.application?.description}</p>
                <p className="invitation-from">
                  Davet Eden: {inv.application?.applicant_name}
                </p>
                
                {inv.status === 'pending' && (
                  <div className="invitation-actions">
                    <button 
                      className="btn btn-success"
                      onClick={() => handleInvitationResponse(inv.id, 'accept')}
                    >
                      Kabul Et
                    </button>
                    <button 
                      className="btn btn-danger"
                      onClick={() => handleInvitationResponse(inv.id, 'reject')}
                    >
                      Reddet
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default MyApplications;

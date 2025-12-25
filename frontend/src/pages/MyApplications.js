import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { clubApplicationService, userService } from '../api/services';
import '../styles/ClubApplication.css';

const MyApplications = () => {
  const [applications, setApplications] = useState([]); // Club Creation Applications
  const [invitations, setInvitations] = useState([]);
  const [memberships, setMemberships] = useState([]); // Club Memberships (Active/Pending)
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('memberships');
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    let errorMsg = '';

    try {
      const profile = await userService.getProfile().catch(e => {
        console.error('Profile fetch error:', e);
        errorMsg += `Profil yüklenemedi: ${e.response?.data?.error || e.message}. `;
        return { clubs: [] };
      });
      setMemberships(profile.clubs || []);
    } catch (e) { console.error(e); }

    try {
      const apps = await clubApplicationService.getApplications('all').catch(e => {
        console.error('Applications fetch error:', e);
        errorMsg += `Başvurular yüklenemedi: ${e.response?.data?.error || e.message}. `;
        return [];
      });
      setApplications(apps);
    } catch (e) { console.error(e); }

    try {
      const invs = await clubApplicationService.getMyInvitations().catch(e => {
        console.error('Invitations fetch error:', e);
        // Dont show error for invitations if it's just empty or 404
        return [];
      });
      setInvitations(invs);
    } catch (e) { console.error(e); }

    if (errorMsg) {
      setError(errorMsg);
    } else {
      setError('');
    }

    setLoading(false);
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
      active: { text: 'Aktif', class: 'badge-success' },
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
        <h2>Başvurularım ve Üyeliklerim</h2>
        <Link to="/create-club-application" className="btn btn-primary">
          + Yeni Kulüp Kur
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'memberships' ? 'active' : ''}`}
          onClick={() => setActiveTab('memberships')}
        >
          Kulüp Üyelikleri ({memberships.length})
        </button>
        <button
          className={`tab ${activeTab === 'applications' ? 'active' : ''}`}
          onClick={() => setActiveTab('applications')}
        >
          Kulüp Kurma Başvuruları ({applications.length})
        </button>
        <button
          className={`tab ${activeTab === 'invitations' ? 'active' : ''}`}
          onClick={() => setActiveTab('invitations')}
        >
          Gelen Davetler ({invitations.filter(i => i.status === 'pending').length})
        </button>
      </div>

      {activeTab === 'memberships' && (
        <div className="applications-list">
          {memberships.length === 0 ? (
            <div className="empty-state">
              <p>Henüz bir kulüp üyeliğiniz veya başvurunuz bulunmamaktadır.</p>
              <Link to="/clubs" className="btn btn-primary">
                Kulüplere Göz At
              </Link>
            </div>
          ) : (
            memberships.map((member, index) => (
              <div key={index} className="application-item">
                <div className="application-header">
                  <h3>{member.club_name}</h3>
                  {getStatusBadge(member.status)}
                </div>
                <div className="application-meta">
                  <span><strong>Rol:</strong> {member.role === 'member' ? 'Üye' : member.role}</span>
                  <span><strong>Katılım Tarihi:</strong> {new Date(member.joined_at).toLocaleDateString('tr-TR')}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'applications' && (
        <div className="applications-list">
          {applications.length === 0 ? (
            <div className="empty-state">
              <p>Henüz bir kulüp kurma başvurunuz yok.</p>
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

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { clubService } from '../api/services';
import { useAuth } from '../context/AuthContext';
import '../styles/Clubs.css';

const ClubList = () => {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joiningClubId, setJoiningClubId] = useState(null);
  const [selectedClub, setSelectedClub] = useState(null);
  const [viewingMembersClub, setViewingMembersClub] = useState(null); // For Admin Member View
  const { user } = useAuth();

  useEffect(() => {
    loadClubs();
  }, []);

  const loadClubs = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await clubService.getClubs('active');
      setClubs(data.clubs);
    } catch (err) {
      console.error('Kulüpler yükleme hatası:', err);
      setError('Kulüpler yüklenirken hata oluştu: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClub = async (clubId) => {
    try {
      setJoiningClubId(clubId);
      const response = await clubService.joinClub(clubId);
      alert(`✅ ${response.message || 'Başvurunuz başarıyla alındı. Onay bekleniyor.'}`);
      loadClubs();
    } catch (err) {
      alert(`❌ ${err.response?.data?.error || 'Hata oluştu'}`);
    } finally {
      setJoiningClubId(null);
    }
  };

  const handleShowDetails = (club) => {
    setSelectedClub(club);
  };

  const handleViewMembers = async (clubId) => {
    try {
      const data = await clubService.getClub(clubId);
      setViewingMembersClub(data);
    } catch (err) {
      alert('Üye listesi alınamadı: ' + (err.response?.data?.error || err.message));
    }
  };

  const closeModal = () => {
    setSelectedClub(null);
    setViewingMembersClub(null);
  };

  if (loading) return <div className="loading">Yükleniyor...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="clubs-container">
      <div className="clubs-header">
        <h1>Kulüpler</h1>
        {user?.role === 'student' && (
          <Link to="/create-club-application" className="btn-primary">
            Yeni Kulüp Kur
          </Link>
        )}
      </div>

      <div className="clubs-grid">
        {clubs.length === 0 ? (
          <p>Henüz aktif kulüp bulunmamaktadır.</p>
        ) : (
          clubs.map((club) => (
            <div key={club.id} className="club-card">
              <div className="club-header">
                <h3>{club.name}</h3>
                <span className="member-count">
                  👥 {club.member_count || 0} üye
                </span>
              </div>

              <div className="club-info">
                <p><strong>Danışman:</strong> {club.advisor_name}</p>
                <p><strong>Durum:</strong> {club.status === 'active' ? '✅ Aktif' : '⏳ Beklemede'}</p>
              </div>

              <div className="club-actions">
                <button
                  onClick={() => handleShowDetails(club)}
                  className="btn-secondary"
                >
                  Detaylar
                </button>

                {user?.role === 'student' && (
                  <button
                    onClick={() => handleJoinClub(club.id)}
                    className="btn-primary"
                    disabled={joiningClubId === club.id}
                  >
                    {joiningClubId === club.id ? 'İşleniyor...' : 'Katıl'}
                  </button>
                )}

                {user?.role === 'sks_admin' && (
                  <button
                    onClick={() => handleViewMembers(club.id)}
                    className="btn-primary"
                    style={{ backgroundColor: '#2c3e50' }}
                  >
                    Üyeler
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Modal */}
      {selectedClub && (
        <div className="modal-overlay" onClick={closeModal} style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{
            backgroundColor: 'white', padding: '20px', borderRadius: '8px', maxWidth: '500px', width: '90%', position: 'relative', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <button onClick={closeModal} style={{
              position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer'
            }}>&times;</button>
            <h2 style={{ marginTop: 0 }}>{selectedClub.name}</h2>
            <div style={{ margin: '20px 0', lineHeight: '1.6', maxHeight: '60vh', overflowY: 'auto' }}>
              <p><strong>Açıklama:</strong></p>
              <p>{selectedClub.description}</p>
              <hr style={{ margin: '15px 0', border: 'none', borderTop: '1px solid #eee' }} />
              <p><small><strong>Kuruluş:</strong> {new Date(selectedClub.created_at).toLocaleDateString()}</small></p>
              <p><small><strong>Danışman:</strong> {selectedClub.advisor_name}</small></p>
            </div>
            <button onClick={closeModal} className="btn-primary" style={{ width: '100%' }}>Kapat</button>
          </div>
        </div>
      )}

      {/* Members Modal for Admin */}
      {viewingMembersClub && (
        <div className="modal-overlay" onClick={closeModal} style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{
            backgroundColor: 'white', padding: '20px', borderRadius: '8px', maxWidth: '800px', width: '90%', position: 'relative', maxHeight: '80vh', overflowY: 'auto'
          }}>
            <button onClick={closeModal} style={{
              position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer'
            }}>&times;</button>
            <h2>{viewingMembersClub.name} - Üye Listesi</h2>

            <table className="table" style={{ width: '100%', marginTop: '10px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: '10px' }}>Ad Soyad</th>
                  <th style={{ padding: '10px' }}>Öğrenci No</th>
                  <th style={{ padding: '10px' }}>Bölüm</th>
                  <th style={{ padding: '10px' }}>Rol</th>
                </tr>
              </thead>
              <tbody>
                {viewingMembersClub.members && viewingMembersClub.members.length > 0 ? (
                  viewingMembersClub.members.map(member => (
                    <tr key={member.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px' }}>{member.first_name} {member.last_name}</td>
                      <td style={{ padding: '10px' }}>{member.student_number}</td>
                      <td style={{ padding: '10px' }}>{member.department}</td>
                      <td style={{ padding: '10px' }}>{member.membership_role || member.role}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="4" style={{ padding: '20px', textAlign: 'center' }}>Üye bulunamadı.</td></tr>
                )}
              </tbody>
            </table>
            <button onClick={closeModal} className="btn-primary" style={{ marginTop: '20px', width: '100%' }}>Kapat</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClubList;

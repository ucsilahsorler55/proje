import React, { useState, useEffect } from 'react';
import { clubService } from '../api/services';
import { useAuth } from '../context/AuthContext';
import '../styles/Clubs.css';

const ClubList = () => {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
      await clubService.joinClub(clubId);
      alert('Kulübe başarıyla katıldınız!');
      loadClubs();
    } catch (err) {
      alert(err.response?.data?.error || 'Kulübe katılırken hata oluştu');
    }
  };

  if (loading) return <div className="loading">Yükleniyor...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="clubs-container">
      <div className="clubs-header">
        <h1>Kulüpler</h1>
        {user?.role === 'student' && (
          <a href="/clubs/create" className="btn-primary">
            Yeni Kulüp Kur
          </a>
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
              
              <p className="club-description">{club.description}</p>
              
              <div className="club-info">
                <p><strong>Danışman:</strong> {club.advisor_name}</p>
                <p><strong>Durum:</strong> {club.status === 'active' ? '✅ Aktif' : '⏳ Beklemede'}</p>
              </div>

              <div className="club-actions">
                <a href={`/clubs/${club.id}`} className="btn-secondary">
                  Detaylar
                </a>
                {user?.role === 'student' && (
                  <button
                    onClick={() => handleJoinClub(club.id)}
                    className="btn-primary"
                  >
                    Katıl
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ClubList;

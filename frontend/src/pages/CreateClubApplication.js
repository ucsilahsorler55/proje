import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clubApplicationService } from '../api/services';
import '../styles/ClubApplication.css';

const CreateClubApplication = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    club_name: '',
    description: ''
  });
  const [founders, setFounders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const results = await clubApplicationService.searchUsers(query);
      // Zaten eklenen kullanıcıları filtrele
      const filtered = results.filter(
        user => !founders.find(f => f.id === user.id)
      );
      setSearchResults(filtered);
    } catch (err) {
      console.error('Arama hatası:', err);
    }
  };

  const addFounder = (user) => {
    setFounders([...founders, user]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeFounder = (userId) => {
    setFounders(founders.filter(f => f.id !== userId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const applicationData = {
        club_name: formData.club_name,
        description: formData.description,
        founder_ids: founders.map(f => f.id)
      };

      await clubApplicationService.createApplication(applicationData);
      setSuccess('Başvurunuz başarıyla oluşturuldu! SKS incelemesinden sonra bilgilendirileceksiniz.');
      
      setTimeout(() => {
        navigate('/my-applications');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Başvuru oluşturulurken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="club-application-container">
      <div className="application-card">
        <h2>Yeni Kulüp Başvurusu</h2>
        <p className="subtitle">Yeni bir kulüp kurmak için aşağıdaki formu doldurun</p>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="club_name">Kulüp Adı *</label>
            <input
              type="text"
              id="club_name"
              name="club_name"
              value={formData.club_name}
              onChange={handleChange}
              placeholder="Örn: Yazılım Geliştirme Kulübü"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Kulüp Açıklaması *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Kulübün amacı, hedefleri ve planlanan aktiviteler..."
              rows={5}
              required
            />
          </div>

          <div className="form-group">
            <label>Kurucu Üyeler (Opsiyonel)</label>
            <p className="helper-text">
              Kulübü birlikte kuracağınız üyeleri ekleyin. Onlara davet gönderilecek.
            </p>
            
            <div className="search-container">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearch}
                placeholder="İsim, e-posta veya öğrenci numarası ile ara..."
                className="search-input"
              />
              
              {searchResults.length > 0 && (
                <div className="search-results">
                  {searchResults.map(user => (
                    <div 
                      key={user.id} 
                      className="search-result-item"
                      onClick={() => addFounder(user)}
                    >
                      <span className="user-name">{user.name}</span>
                      <span className="user-email">{user.email}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {founders.length > 0 && (
              <div className="founders-list">
                <h4>Seçilen Kurucu Üyeler:</h4>
                {founders.map(founder => (
                  <div key={founder.id} className="founder-tag">
                    <span>{founder.name}</span>
                    <button 
                      type="button" 
                      onClick={() => removeFounder(founder.id)}
                      className="remove-btn"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => navigate(-1)}
            >
              İptal
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Gönderiliyor...' : 'Başvuruyu Gönder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateClubApplication;

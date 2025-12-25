import React, { useState } from 'react';
import { clubService } from '../api/services';

const ClubAnnouncements = () => {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            await clubService.makeAnnouncement({
                title,
                message
            });

            setSuccess('Duyuru başarıyla gönderildi.');
            setTitle('');
            setMessage('');
        } catch (err) {
            console.error(err);
            setError('Duyuru gönderilirken bir hata oluştu: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ padding: '40px' }}>
            <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <h2 style={{ borderBottom: '2px solid #ecf0f1', paddingBottom: '10px', marginBottom: '20px' }}>Duyuru Yap</h2>

                {error && <div className="alert alert-error" style={{ marginBottom: '20px' }}>{error}</div>}
                {success && <div className="alert alert-success" style={{ marginBottom: '20px' }}>{success}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Başlık:</label>
                        <input
                            type="text"
                            className="form-control"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Duyuru Metni:</label>
                        <textarea
                            className="form-control"
                            rows="5"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            required
                        ></textarea>
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: '10px' }}>
                        {loading ? 'Gönderiliyor...' : 'Duyuruyu Yayınla'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ClubAnnouncements;

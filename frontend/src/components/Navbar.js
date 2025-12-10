import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Navbar.css';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          🎓 Kulüp Sistemi
        </Link>

        <ul className="navbar-menu">
          {isAuthenticated ? (
            <>
              <li><Link to="/clubs">Kulüpler</Link></li>

              {['student', 'club_admin'].includes(user?.role) && (
                <>
                  <li><Link to="/events">Etkinlikler</Link></li>
                  <li><Link to="/my-applications">Başvurularım</Link></li>
                </>
              )}

              {user?.role === 'sks_admin' && (
                <li><Link to="/admin">Admin Panel</Link></li>
              )}

              <li><Link to="/notifications">Bildirimler</Link></li>
              <li><Link to="/profile">Profil</Link></li>
              <li>
                <span className="user-info">
                  {user?.first_name} {user?.last_name} ({user?.role})
                </span>
              </li>
              <li>
                <button onClick={handleLogout} className="btn-logout">
                  Çıkış
                </button>
              </li>
            </>
          ) : (
            <>
              <li><Link to="/login">Giriş</Link></li>
              <li><Link to="/register">Kayıt Ol</Link></li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;

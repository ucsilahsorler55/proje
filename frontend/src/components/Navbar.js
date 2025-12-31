import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Navbar.css";

const Navbar = () => {
    const { user, logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/" className="navbar-logo">
                    🎓 <span>Kulüp Sistemi</span>
                </Link>

                <ul className="navbar-menu">
                    {isAuthenticated ? (
                        <>
                            {/* Student specific links */}
                            {user?.role === "student" && (
                                <>
                                    <li>
                                        <Link to="/clubs">🏢 Kulüpler</Link>
                                    </li>
                                    <li>
                                        <Link to="/events">🎪 Etkinlikler</Link>
                                    </li>
                                    <li>
                                        <Link to="/my-applications">
                                            📋 Başvurularım
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/notifications">
                                            🔔 Bildirimler
                                        </Link>
                                    </li>
                                </>
                            )}

                            {/* Club Admin specific links */}
                            {user?.role === "club_admin" && (
                                <>
                                    <li>
                                        <Link to="/create-event">
                                            🎪 Etkinlik Oluştur
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/announcements">
                                            📢 Duyuru Yap
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/membership-applications">
                                            👥 Üyelik Başvuruları
                                        </Link>
                                    </li>
                                </>
                            )}

                            {/* SKS Admin specific links */}
                            {user?.role === "sks_admin" && (
                                <>
                                    <li>
                                        <Link to="/admin">👑 Admin Panel</Link>
                                    </li>
                                    <li>
                                        <Link to="/clubs">🏢 Kulüpler</Link>
                                    </li>
                                </>
                            )}

                            {/* Profil linki: Kulüp yöneticisi için /club-manager, diğerleri için /profile */}
                            <li>
                                <Link
                                    to={
                                        user?.role === "club_admin"
                                            ? "/club-manager"
                                            : "/profile"
                                    }
                                >
                                    👤 Profil
                                </Link>
                            </li>

                            <li>
                                <span className="user-info">
                                    {user?.first_name} {user?.last_name}
                                </span>
                            </li>
                            <li>
                                <button
                                    onClick={handleLogout}
                                    className="btn-logout"
                                >
                                    Çıkış Yap
                                </button>
                            </li>
                        </>
                    ) : (
                        <>
                            <li>
                                <Link to="/login">🔑 Giriş</Link>
                            </li>
                            <li>
                                <Link to="/register">📝 Kayıt Ol</Link>
                            </li>
                        </>
                    )}
                </ul>
            </div>
        </nav>
    );
};

export default Navbar;

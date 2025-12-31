import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Auth.css";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const data = await login(email, password);
            if (data.user.role === "club_admin") {
                navigate("/club-manager");
            } else {
                navigate("/clubs");
            }
        } catch (err) {
            setError(err.response?.data?.error || "Giriş başarısız");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>🔐 Hoş Geldiniz</h2>

                {error && <div className="error-message">⚠️ {error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>📧 Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="ornek@university.edu"
                        />
                    </div>

                    <div className="form-group">
                        <label>🔑 Şifre</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                    >
                        {loading ? "⏳ Giriş yapılıyor..." : "🚀 Giriş Yap"}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        Hesabınız yok mu? <Link to="/register">Kayıt olun</Link>
                    </p>
                </div>

                <div className="test-accounts">
                    <h4>Test Hesapları</h4>
                    <p>👑 admin@university.edu / 123456</p>
                    <p>🎓 student1@university.edu / 123456</p>
                </div>
            </div>
        </div>
    );
};

export default Login;

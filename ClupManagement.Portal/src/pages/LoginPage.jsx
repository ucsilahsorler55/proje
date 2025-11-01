import React, { useState } from "react";

function LoginPage({ onLogin }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");

        const res = await fetch("http://127.0.0.1:5000/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (res.ok) {
            console.log("✅ Login başarılı, token:", data.token);
            localStorage.setItem("token", data.token);
            onLogin();
        } else {
            setError(data.error || "Giriş başarısız");
        }
    };

    return (
        <div
            style={{ maxWidth: 400, margin: "80px auto", textAlign: "center" }}
        >
            <h2>🎓 Giriş Yap</h2>
            <form onSubmit={handleLogin}>
                <input
                    type="email"
                    placeholder="E-posta"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ width: "100%", marginBottom: 10, padding: 8 }}
                />
                <input
                    type="password"
                    placeholder="Şifre"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ width: "100%", marginBottom: 10, padding: 8 }}
                />
                <button type="submit" style={{ padding: "8px 16px" }}>
                    Giriş
                </button>
            </form>
            {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
    );
}

export default LoginPage;

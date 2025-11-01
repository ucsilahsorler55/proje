import React, { useEffect, useState } from "react";

function SystemMessagePage() {
    const [message, setMessage] = useState("");
    const [user, setUser] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("token");
        console.log("📦 Token:", token);

        if (!token) {
            setMessage("Token bulunamadı — tekrar giriş yap!");
            return;
        }

        fetch("http://127.0.0.1:5000/api/system-message", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        })
            .then(async (res) => {
                if (!res.ok) {
                    const err = await res.text();
                    throw new Error(`HTTP ${res.status} - ${err}`);
                }
                return res.json();
            })
            .then((data) => {
                console.log("✅ API yanıtı:", data);
                setMessage(data.message);
                setUser(data.user);
            })
            .catch((err) => {
                console.error("❌ Fetch hatası:", err);
                setMessage("Sistem mesajı yüklenemedi");
            });
    }, []);

    return (
        <div style={{ textAlign: "center", marginTop: 100 }}>
            <h2>Hoşgeldin {user || "👋"}</h2>
            <p style={{ fontSize: 18, color: "blue" }}>{message}</p>
        </div>
    );
}

export default SystemMessagePage;

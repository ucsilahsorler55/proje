import React, { useEffect, useState } from "react";
import { Alert, Spin } from "antd";

const SystemMessage = () => {
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        // Flask API'den sistem mesajını çek
        fetch("http://127.0.0.1:5000/api/system-message")
            .then((res) => {
                if (!res.ok) throw new Error("Sunucu hatası");
                return res.json();
            })
            .then((data) => {
                setMessage(data.message || "Aktif mesaj bulunamadı");
            })
            .catch(() => {
                setError("Sistem duyurusu yüklenemedi");
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <Spin tip="Yükleniyor..." />;
    if (error) return <Alert message={error} type="error" />;

    return (
        <Alert
            message="Sistem Duyurusu"
            description={message}
            type="info"
            showIcon
        />
    );
};

export default SystemMessage;

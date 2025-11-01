from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt
import psycopg2
import datetime

app = Flask(__name__)
CORS(app)

# 🔑 JWT ayarları
app.config["JWT_SECRET_KEY"] = "super_secret_key_123"  # kendine göre değiştir
jwt = JWTManager(app)
app.config["JSON_AS_ASCII"] = False  # Türkçe karakter desteği

# 🧱 Veritabanı bilgileri
DB_CONFIG = {
    "host": "localhost",
    "database": "club_management",
    "user": "postgres",
    "password": "1234",
}


# 🔹 LOGIN endpoint
@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        cur.execute(
            "SELECT id, name, password_hash FROM users WHERE email = %s;", (email,)
        )
        user = cur.fetchone()

        if not user:
            return jsonify({"error": "Kullanıcı bulunamadı"}), 404
        if user[2] != password:
            return jsonify({"error": "Hatalı şifre"}), 401

        # ✅ Token oluşturma
        access_token = create_access_token(
            identity=str(user[0]),  # sadece kullanıcı id'si
            additional_claims={"name": user[1], "email": email},
            expires_delta=datetime.timedelta(hours=1),
        )

        return jsonify(
            {
                "token": access_token,
                "user": {"id": user[0], "name": user[1], "email": email},
            }
        )

    except Exception as e:
        print("❌ Login Hatası:", e)
        return jsonify({"error": str(e)}), 500
    finally:
        if "cur" in locals():
            cur.close()
        if "conn" in locals():
            conn.close()


# 🔹 SİSTEM MESAJI endpoint
@app.route("/api/system-message", methods=["GET"])
@jwt_required()
def system_message():
    claims = get_jwt()
    user_name = claims.get("name", "Anonim")

    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        cur.execute(
            "SELECT message_text FROM system_messages WHERE is_active = TRUE LIMIT 1;"
        )
        row = cur.fetchone()
        msg = row[0] if row else "Aktif sistem mesajı bulunamadı."
        return jsonify({"message": msg, "user": user_name}), 200

    except Exception as e:
        print("❌ Hata:", e)
        return jsonify({"error": str(e)}), 500
    finally:
        if "cur" in locals():
            cur.close()
        if "conn" in locals():
            conn.close()


if __name__ == "__main__":
    app.run(debug=True)

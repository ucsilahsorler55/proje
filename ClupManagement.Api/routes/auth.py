from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token
import psycopg2
import datetime
from config import DB_CONFIG

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        cur.execute("SELECT id, name, password_hash FROM users WHERE email = %s;", (email,))
        user = cur.fetchone()

        if not user:
            return jsonify({"error": "Kullanıcı bulunamadı"}), 404
        if user[2] != password:
            return jsonify({"error": "Hatalı şifre"}), 401

        access_token = create_access_token(
            identity=str(user[0]),
            additional_claims={"name": user[1], "email": email},
            expires_delta=datetime.timedelta(hours=1),
        )

        return jsonify({
            "token": access_token,
            "user": {"id": user[0], "name": user[1], "email": email}
        })

    except Exception as e:
        print("❌ Login Hatası:", e)
        return jsonify({"error": str(e)}), 500
    finally:
        if "cur" in locals(): cur.close()
        if "conn" in locals(): conn.close()

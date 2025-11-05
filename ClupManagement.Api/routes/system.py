from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt
import psycopg2
from config import DB_CONFIG

system_bp = Blueprint("system", __name__)

@system_bp.route("/api/system-message", methods=["GET"])
@jwt_required()
def system_message():
    claims = get_jwt()
    user_name = claims.get("name", "Anonim")

    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        cur.execute("SELECT message_text FROM system_messages WHERE is_active = TRUE LIMIT 1;")
        row = cur.fetchone()
        msg = row[0] if row else "Aktif sistem mesajı bulunamadı."
        return jsonify({"message": msg, "user": user_name}), 200

    except Exception as e:
        print("❌ Hata:", e)
        return jsonify({"error": str(e)}), 500
    finally:
        if "cur" in locals(): cur.close()
        if "conn" in locals(): conn.close()

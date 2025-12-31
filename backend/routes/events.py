from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models import (
    db,
    Event,
    Club,
    ClubMembership,
    EventParticipant,
    EventInvitation,
    User,
    Notification,
)
from datetime import datetime

events_bp = Blueprint("events", __name__)


@events_bp.route("/", methods=["GET"])
def get_events():
    """Tüm etkinlikleri listele"""
    status = request.args.get("status")
    club_id = request.args.get("club_id")

    query = Event.query

    if status:
        query = query.filter_by(status=status)
    if club_id:
        query = query.filter_by(club_id=club_id)

    events = query.order_by(Event.event_date.desc()).all()

    return jsonify({"events": [event.to_dict() for event in events]}), 200


@events_bp.route("/<int:event_id>", methods=["GET"])
def get_event(event_id):
    """Etkinlik detayı"""
    event = Event.query.get_or_404(event_id)

    event_data = event.to_dict()
    event_data["club_name"] = event.club.name

    return jsonify(event_data), 200


@events_bp.route("/", methods=["POST"])
@jwt_required()
def create_event():
    """Yeni etkinlik oluşturma (Kulüp Yöneticisi)"""
    user_id = int(get_jwt_identity())
    data = request.get_json()

    required_fields = ["club_id", "title", "description", "event_date", "location"]
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Tüm alanları doldurun"}), 400

    # Kulüp üyeliği kontrolü
    membership = ClubMembership.query.filter_by(
        club_id=data["club_id"], user_id=user_id
    ).first()

    if not membership or membership.role not in ["president", "vice_president"]:
        return jsonify({"error": "Bu kulüp için etkinlik oluşturma yetkiniz yok"}), 403

    # Tarih parse
    try:
        event_date = datetime.fromisoformat(data["event_date"].replace("Z", "+00:00"))
    except Exception as e:
        print(f"Date parse error: {e}")
        return jsonify({"error": "Geçersiz tarih formatı"}), 400

    # Kapasite kontrolü (Boş string gelirse None yap)
    capacity = data.get("capacity")
    if capacity == "":
        capacity = None

    try:
        event = Event(
            club_id=data["club_id"],
            title=data["title"],
            description=data["description"],
            event_date=event_date,
            location=data["location"],
            capacity=capacity,
            created_by=user_id,
            status="pending",  # SKS onayı bekliyor
        )

        db.session.add(event)
        db.session.commit()

        return (
            jsonify(
                {
                    "message": "Etkinlik oluşturuldu, SKS onayı bekleniyor",
                    "event": event.to_dict(),
                }
            ),
            201,
        )
    except Exception as e:
        db.session.rollback()
        print(f"Event creation error: {e}")
        return jsonify({"error": f"Etkinlik oluşturulurken hata: {str(e)}"}), 500


@events_bp.route("/<int:event_id>/register", methods=["POST"])
@jwt_required()
def register_event(event_id):
    """Etkinliğe kayıt olma"""
    user_id = int(get_jwt_identity())

    event = Event.query.get_or_404(event_id)

    if event.status != "approved":
        return jsonify({"error": "Bu etkinlik henüz onaylanmamış"}), 400

    # Kapasite kontrolü
    if event.capacity:
        current_count = len(event.participants)
        if current_count >= event.capacity:
            return jsonify({"error": "Etkinlik kapasitesi doldu"}), 400

    # Zaten kayıtlı mı?
    existing_participant = EventParticipant.query.filter_by(
        event_id=event_id, user_id=user_id
    ).first()

    if existing_participant:
        return jsonify({"error": "Zaten bu etkinliğe kayıtlısınız"}), 400

    participant = EventParticipant(event_id=event_id, user_id=user_id)

    db.session.add(participant)
    db.session.commit()

    return jsonify({"message": "Etkinliğe başarıyla kayıt oldunuz"}), 201


@events_bp.route("/<int:event_id>/register", methods=["DELETE"])
@jwt_required()
def cancel_registration(event_id):
    """Etkinlik kaydını iptal etme"""
    user_id = int(get_jwt_identity())

    participant = EventParticipant.query.filter_by(
        event_id=event_id, user_id=user_id
    ).first_or_404()

    db.session.delete(participant)
    db.session.commit()

    return jsonify({"message": "Etkinlik kaydı iptal edildi"}), 200


@events_bp.route("/my-events", methods=["GET"])
@jwt_required()
def get_my_events():
    """Öğrencinin kayıt olduğu etkinlikler"""
    user_id = int(get_jwt_identity())

    participants = EventParticipant.query.filter_by(user_id=user_id).all()
    events = []

    for p in participants:
        event_data = p.event.to_dict()
        event_data["club_name"] = p.event.club.name
        event_data["registered_at"] = p.registered_at.isoformat()
        events.append(event_data)

    return jsonify({"events": events}), 200


@events_bp.route("/<int:event_id>/participants", methods=["GET"])
@jwt_required()
def get_event_participants(event_id):
    """Etkinlik katılımcılarını listele (Kulüp Yöneticisi)"""
    user_id = int(get_jwt_identity())
    event = Event.query.get_or_404(event_id)

    # Yetki kontrolü (Sadece o kulübün yöneticisi görebilir)
    membership = ClubMembership.query.filter_by(
        club_id=event.club_id, user_id=user_id
    ).first()

    if not membership or membership.role not in ["president", "vice_president"]:
        return jsonify({"error": "Bu işlem için yetkiniz yok"}), 403

    participants = []
    for p in event.participants:
        user_data = p.user.to_dict()
        user_data["registered_at"] = p.registered_at.isoformat()
        participants.append(user_data)

    return jsonify({"participants": participants}), 200


@events_bp.route("/<int:event_id>/status", methods=["PUT"])
@jwt_required()
def update_event_status(event_id):
    """Etkinlik durumunu güncelle (SKS Admin)"""
    claims = get_jwt()
    if claims.get("role") != "sks_admin":
        return jsonify({"error": "Bu işlem için yetkiniz yok"}), 403

    event = Event.query.get_or_404(event_id)
    data = request.get_json()

    new_status = data.get("status")
    if new_status not in ["approved", "rejected"]:
        return jsonify({"error": "Geçersiz durum"}), 400

    event.status = new_status
    db.session.commit()

    return (
        jsonify(
            {
                "message": f"Etkinlik durumu {new_status} olarak güncellendi",
                "event": event.to_dict(),
            }
        ),
        200,
    )

    # Zaten kayıtlı mı?
    existing = EventParticipant.query.filter_by(
        event_id=event_id, user_id=user_id
    ).first()

    if existing:
        return jsonify({"error": "Bu etkinliğe zaten kayıtlısınız"}), 400

    participant = EventParticipant(event_id=event_id, user_id=user_id)

    db.session.add(participant)
    db.session.commit()

    return jsonify({"message": "Etkinliğe kayıt oldunuz"}), 201


@events_bp.route("/<int:event_id>/approve", methods=["POST"])
@jwt_required()
def approve_event(event_id):
    """Etkinliği onayla (SKS Admin)"""
    claims = get_jwt()
    if claims.get("role") != "sks_admin":
        return jsonify({"error": "Bu işlem için yetkiniz yok"}), 403

    event = Event.query.get_or_404(event_id)

    if event.status != "pending":
        return jsonify({"error": "Bu etkinlik zaten işleme alınmış"}), 400

    event.status = "approved"
    db.session.commit()

    return jsonify({"message": "Etkinlik onaylandı", "event": event.to_dict()}), 200


@events_bp.route("/<int:event_id>/reject", methods=["POST"])
@jwt_required()
def reject_event(event_id):
    """Etkinliği reddet (SKS Admin)"""
    claims = get_jwt()
    if claims.get("role") != "sks_admin":
        return jsonify({"error": "Bu işlem için yetkiniz yok"}), 403

    event = Event.query.get_or_404(event_id)

    if event.status != "pending":
        return jsonify({"error": "Bu etkinlik zaten işleme alınmış"}), 400

    event.status = "rejected"
    db.session.commit()

    return jsonify({"message": "Etkinlik reddedildi"}), 200


@events_bp.route("/<int:event_id>/invite", methods=["POST"])
@jwt_required()
def invite_to_event(event_id):
    """Öğrenciyi etkinliğe davet et (Kulüp Yöneticisi)"""
    user_id = int(get_jwt_identity())
    data = request.get_json()

    event = Event.query.get_or_404(event_id)

    # Kulüp yöneticisi kontrolü
    membership = ClubMembership.query.filter_by(
        club_id=event.club_id, user_id=user_id
    ).first()

    if not membership or membership.role not in ["president", "vice_president"]:
        return jsonify({"error": "Bu işlem için yetkiniz yok"}), 403

    invited_user_ids = data.get("user_ids", [])
    if not invited_user_ids:
        return jsonify({"error": "Davet edilecek kullanıcı seçilmedi"}), 400

    invited_count = 0
    for uid in invited_user_ids:
        # Zaten davet edilmiş mi?
        existing = EventInvitation.query.filter_by(
            event_id=event_id, user_id=uid
        ).first()
        if existing:
            continue

        # Zaten kayıtlı mı?
        already_registered = EventParticipant.query.filter_by(
            event_id=event_id, user_id=uid
        ).first()
        if already_registered:
            continue

        invitation = EventInvitation(event_id=event_id, user_id=uid, invited_by=user_id)
        db.session.add(invitation)

        # Bildirim gönder
        notification = Notification(
            user_id=uid,
            title="Etkinlik Daveti",
            message=f'"{event.title}" etkinliğine davet edildiniz.',
        )
        db.session.add(notification)
        invited_count += 1

    db.session.commit()

    return jsonify({"message": f"{invited_count} kişi davet edildi"}), 201


@events_bp.route("/my-invitations", methods=["GET"])
@jwt_required()
def get_my_event_invitations():
    """Kullanıcının etkinlik davetlerini getir"""
    user_id = int(get_jwt_identity())

    invitations = (
        EventInvitation.query.filter_by(user_id=user_id)
        .order_by(EventInvitation.created_at.desc())
        .all()
    )

    return jsonify({"invitations": [inv.to_dict() for inv in invitations]}), 200


@events_bp.route("/invitations/<int:invitation_id>/respond", methods=["POST"])
@jwt_required()
def respond_to_event_invitation(invitation_id):
    """Etkinlik davetine cevap ver"""
    user_id = int(get_jwt_identity())
    data = request.get_json()

    invitation = EventInvitation.query.get_or_404(invitation_id)

    if invitation.user_id != user_id:
        return jsonify({"error": "Bu davete cevap verme yetkiniz yok"}), 403

    if invitation.status != "pending":
        return jsonify({"error": "Bu davete zaten cevap verilmiş"}), 400

    action = data.get("action")

    if action == "accept":
        invitation.status = "accepted"

        # Etkinliğe kayıt ol
        existing = EventParticipant.query.filter_by(
            event_id=invitation.event_id, user_id=user_id
        ).first()

        if not existing:
            participant = EventParticipant(
                event_id=invitation.event_id, user_id=user_id
            )
            db.session.add(participant)

        message = "Davet kabul edildi ve etkinliğe kaydınız yapıldı"
    elif action == "reject":
        invitation.status = "rejected"
        message = "Davet reddedildi"
    else:
        return jsonify({"error": "Geçersiz işlem"}), 400

    db.session.commit()

    return jsonify({"message": message}), 200


@events_bp.route("/search-users", methods=["GET"])
@jwt_required()
def search_users_for_invite():
    """Davet için öğrenci ara"""
    query = request.args.get("q", "")

    if len(query) < 2:
        return jsonify({"users": []}), 200

    users = (
        User.query.filter(
            User.role == "student",
            db.or_(
                User.first_name.ilike(f"%{query}%"),
                User.last_name.ilike(f"%{query}%"),
                User.email.ilike(f"%{query}%"),
                User.student_number.ilike(f"%{query}%"),
            ),
        )
        .limit(10)
        .all()
    )

    return (
        jsonify(
            {
                "users": [
                    {
                        "id": u.id,
                        "name": f"{u.first_name} {u.last_name}",
                        "email": u.email,
                        "student_number": u.student_number,
                    }
                    for u in users
                ]
            }
        ),
        200,
    )

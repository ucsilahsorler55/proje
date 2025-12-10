from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models import db, Event, Club, ClubMembership, EventParticipant
from datetime import datetime

events_bp = Blueprint('events', __name__)

@events_bp.route('/', methods=['GET'])
def get_events():
    """Tüm etkinlikleri listele"""
    status = request.args.get('status')
    club_id = request.args.get('club_id')
    
    query = Event.query
    
    if status:
        query = query.filter_by(status=status)
    if club_id:
        query = query.filter_by(club_id=club_id)
    
    events = query.order_by(Event.event_date.desc()).all()
    
    return jsonify({
        'events': [event.to_dict() for event in events]
    }), 200


@events_bp.route('/<int:event_id>', methods=['GET'])
def get_event(event_id):
    """Etkinlik detayı"""
    event = Event.query.get_or_404(event_id)
    
    event_data = event.to_dict()
    event_data['club_name'] = event.club.name
    
    return jsonify(event_data), 200


@events_bp.route('/', methods=['POST'])
@jwt_required()
def create_event():
    """Yeni etkinlik oluşturma (Kulüp Yöneticisi)"""
    user_id = int(get_jwt_identity())
    data = request.get_json()
    
    required_fields = ['club_id', 'title', 'description', 'event_date', 'location']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Tüm alanları doldurun'}), 400
    
    # Kulüp üyeliği kontrolü
    membership = ClubMembership.query.filter_by(
        club_id=data['club_id'],
        user_id=user_id
    ).first()
    
    if not membership or membership.role not in ['president', 'vice_president']:
        return jsonify({'error': 'Bu kulüp için etkinlik oluşturma yetkiniz yok'}), 403
    
    # Tarih parse
    try:
        event_date = datetime.fromisoformat(data['event_date'].replace('Z', '+00:00'))
    except:
        return jsonify({'error': 'Geçersiz tarih formatı'}), 400
    
    event = Event(
        club_id=data['club_id'],
        title=data['title'],
        description=data['description'],
        event_date=event_date,
        location=data['location'],
        capacity=data.get('capacity'),
        created_by=user_id,
        status='pending'  # SKS onayı bekliyor
    )
    
    db.session.add(event)
    db.session.commit()
    
    return jsonify({
        'message': 'Etkinlik oluşturuldu, SKS onayı bekleniyor',
        'event': event.to_dict()
    }), 201


@events_bp.route('/<int:event_id>/register', methods=['POST'])
@jwt_required()
def register_event(event_id):
    """Etkinliğe kayıt olma"""
    user_id = int(get_jwt_identity())
    
    event = Event.query.get_or_404(event_id)
    
    if event.status != 'approved':
        return jsonify({'error': 'Bu etkinlik henüz onaylanmamış'}), 400
    
    # Kapasite kontrolü
    if event.capacity:
        current_count = len(event.participants)
        if current_count >= event.capacity:
            return jsonify({'error': 'Etkinlik kapasitesi doldu'}), 400
    
    # Zaten kayıtlı mı?
    existing = EventParticipant.query.filter_by(
        event_id=event_id,
        user_id=user_id
    ).first()
    
    if existing:
        return jsonify({'error': 'Bu etkinliğe zaten kayıtlısınız'}), 400
    
    participant = EventParticipant(
        event_id=event_id,
        user_id=user_id
    )
    
    db.session.add(participant)
    db.session.commit()
    
    return jsonify({'message': 'Etkinliğe kayıt oldunuz'}), 201


@events_bp.route('/<int:event_id>/approve', methods=['POST'])
@jwt_required()
def approve_event(event_id):
    """Etkinliği onayla (SKS Admin)"""
    claims = get_jwt()
    if claims.get('role') != 'sks_admin':
        return jsonify({'error': 'Bu işlem için yetkiniz yok'}), 403
    
    event = Event.query.get_or_404(event_id)
    
    if event.status != 'pending':
        return jsonify({'error': 'Bu etkinlik zaten işleme alınmış'}), 400
    
    event.status = 'approved'
    db.session.commit()
    
    return jsonify({'message': 'Etkinlik onaylandı', 'event': event.to_dict()}), 200


@events_bp.route('/<int:event_id>/reject', methods=['POST'])
@jwt_required()
def reject_event(event_id):
    """Etkinliği reddet (SKS Admin)"""
    claims = get_jwt()
    if claims.get('role') != 'sks_admin':
        return jsonify({'error': 'Bu işlem için yetkiniz yok'}), 403
    
    event = Event.query.get_or_404(event_id)
    
    if event.status != 'pending':
        return jsonify({'error': 'Bu etkinlik zaten işleme alınmış'}), 400
    
    event.status = 'rejected'
    db.session.commit()
    
    return jsonify({'message': 'Etkinlik reddedildi'}), 200

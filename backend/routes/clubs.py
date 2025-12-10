from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models import db, Club, ClubMembership, User
from datetime import datetime

clubs_bp = Blueprint('clubs', __name__)

@clubs_bp.route('/', methods=['GET'])
def get_clubs():
    """Tüm aktif kulüpleri listele"""
    status = request.args.get('status', 'active')
    
    query = Club.query
    if status != 'all':
        query = query.filter_by(status=status)
    
    clubs = query.order_by(Club.name).all()
    
    return jsonify({
        'clubs': [club.to_dict(include_members=True) for club in clubs]
    }), 200


@clubs_bp.route('/<int:club_id>', methods=['GET'])
def get_club(club_id):
    """Kulüp detayı"""
    club = Club.query.get_or_404(club_id)
    
    club_data = club.to_dict(include_members=True)
    
    # Üyeleri ekle
    members = []
    for membership in club.memberships:
        if membership.status == 'active':
            member_data = membership.user.to_dict()
            member_data['membership_role'] = membership.role
            members.append(member_data)
    
    club_data['members'] = members
    
    return jsonify(club_data), 200


@clubs_bp.route('/', methods=['POST'])
@jwt_required()
def create_club():
    """Yeni kulüp kurma (Öğrenci)"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if user.role != 'student':
        return jsonify({'error': 'Sadece öğrenciler kulüp kurabilir'}), 403
    
    data = request.get_json()
    
    required_fields = ['name', 'description', 'advisor_name', 'advisor_email']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Tüm alanları doldurun'}), 400
    
    # Kulüp ismi kontrolü
    if Club.query.filter_by(name=data['name']).first():
        return jsonify({'error': 'Bu isimde bir kulüp zaten var'}), 400
    
    # Yeni kulüp oluştur
    club = Club(
        name=data['name'],
        description=data['description'],
        advisor_name=data['advisor_name'],
        advisor_email=data['advisor_email'],
        founder_id=user_id,
        status='pending'  # SKS onayı bekliyor
    )
    
    db.session.add(club)
    db.session.commit()
    
    # Kurucuyu yönetici olarak ekle
    membership = ClubMembership(
        club_id=club.id,
        user_id=user_id,
        role='president',
        status='active'
    )
    db.session.add(membership)
    db.session.commit()
    
    return jsonify({
        'message': 'Kulüp başvurusu oluşturuldu, SKS onayı bekleniyor',
        'club': club.to_dict()
    }), 201


@clubs_bp.route('/<int:club_id>/join', methods=['POST'])
@jwt_required()
def join_club(club_id):
    """Kulübe üye olma"""
    user_id = int(get_jwt_identity())
    
    club = Club.query.get_or_404(club_id)
    
    if club.status != 'active':
        return jsonify({'error': 'Bu kulüp aktif değil'}), 400
    
    # Zaten üye mi?
    existing = ClubMembership.query.filter_by(
        club_id=club_id,
        user_id=user_id
    ).first()
    
    if existing:
        if existing.status == 'active':
            return jsonify({'error': 'Zaten bu kulübün üyesisiniz'}), 400
        else:
            # Tekrar aktif et
            existing.status = 'active'
            db.session.commit()
            return jsonify({'message': 'Kulübe tekrar katıldınız'}), 200
    
    # Yeni üyelik
    membership = ClubMembership(
        club_id=club_id,
        user_id=user_id,
        role='member',
        status='active'
    )
    
    db.session.add(membership)
    db.session.commit()
    
    return jsonify({'message': 'Kulübe başarıyla katıldınız'}), 201


@clubs_bp.route('/<int:club_id>/leave', methods=['POST'])
@jwt_required()
def leave_club(club_id):
    """Kulüpten ayrılma"""
    user_id = int(get_jwt_identity())
    
    membership = ClubMembership.query.filter_by(
        club_id=club_id,
        user_id=user_id
    ).first()
    
    if not membership:
        return jsonify({'error': 'Bu kulübün üyesi değilsiniz'}), 400
    
    if membership.role == 'president':
        return jsonify({'error': 'Başkan kulüpten ayrılamaz, önce başkanlığı devredin'}), 400
    
    membership.status = 'inactive'
    db.session.commit()
    
    return jsonify({'message': 'Kulüpten ayrıldınız'}), 200


@clubs_bp.route('/<int:club_id>/approve', methods=['POST'])
@jwt_required()
def approve_club(club_id):
    """Kulüp başvurusunu onayla (SKS Admin)"""
    claims = get_jwt()
    if claims.get('role') != 'sks_admin':
        return jsonify({'error': 'Bu işlem için yetkiniz yok'}), 403
    
    club = Club.query.get_or_404(club_id)
    
    if club.status != 'pending':
        return jsonify({'error': 'Bu kulüp zaten işleme alınmış'}), 400
    
    club.status = 'active'
    club.founding_date = datetime.utcnow().date()
    db.session.commit()
    
    return jsonify({'message': 'Kulüp onaylandı', 'club': club.to_dict()}), 200


@clubs_bp.route('/<int:club_id>/reject', methods=['POST'])
@jwt_required()
def reject_club(club_id):
    """Kulüp başvurusunu reddet (SKS Admin)"""
    claims = get_jwt()
    if claims.get('role') != 'sks_admin':
        return jsonify({'error': 'Bu işlem için yetkiniz yok'}), 403
    
    club = Club.query.get_or_404(club_id)
    
    if club.status != 'pending':
        return jsonify({'error': 'Bu kulüp zaten işleme alınmış'}), 400
    
    club.status = 'rejected'
    db.session.commit()
    
    return jsonify({'message': 'Kulüp reddedildi'}), 200

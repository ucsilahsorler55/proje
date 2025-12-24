from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models import db, User, Notification

users_bp = Blueprint('users', __name__)

@users_bp.route('/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    """Kullanıcının bildirimlerini listele"""
    user_id = int(get_jwt_identity())
    
    notifications = Notification.query.filter_by(user_id=user_id).order_by(Notification.created_at.desc()).all()
    
    return jsonify([n.to_dict() for n in notifications]), 200

@users_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Kullanıcı profili"""
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    
    profile = user.to_dict()
    
    # Üye olduğu kulüpler
    clubs = []
    # Üye olduğu kulüpler
    clubs = []
    for membership in user.memberships:
        # Tüm üyelikleri (aktif, beklemede) gönder
        if membership.status in ['active', 'pending']:
            clubs.append({
                'club_id': membership.club.id,
                'club_name': membership.club.name,
                'role': membership.role,
                'status': membership.status,
                'joined_at': membership.joined_at.isoformat()
            })
    
    profile['clubs'] = clubs
    
    return jsonify(profile), 200


@users_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Profil güncelleme"""
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    
    data = request.get_json()
    
    # Güncellenebilir alanlar
    if 'first_name' in data:
        user.first_name = data['first_name']
    if 'last_name' in data:
        user.last_name = data['last_name']
    if 'phone' in data:
        user.phone = data['phone']
    if 'department' in data:
        user.department = data['department']
    
    db.session.commit()
    
    return jsonify({
        'message': 'Profil güncellendi',
        'user': user.to_dict()
    }), 200


@users_bp.route('/', methods=['GET'])
@jwt_required()
def list_users():
    """Tüm kullanıcıları listele (SKS Admin)"""
    claims = get_jwt()
    if claims.get('role') != 'sks_admin':
        return jsonify({'error': 'Bu işlem için yetkiniz yok'}), 403
    
    role = request.args.get('role')
    
    query = User.query
    if role:
        query = query.filter_by(role=role)
    
    users = query.all()
    
    return jsonify({
        'users': [user.to_dict() for user in users]
    }), 200

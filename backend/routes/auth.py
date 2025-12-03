from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import db, User
from datetime import timedelta

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """Öğrenci kaydı"""
    data = request.get_json()
    
    # Validasyon
    required_fields = ['email', 'password', 'first_name', 'last_name', 'student_number', 'department']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Tüm alanları doldurun'}), 400
    
    # Email kontrolü
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Bu email zaten kayıtlı'}), 400
    
    # Öğrenci numarası kontrolü
    if User.query.filter_by(student_number=data['student_number']).first():
        return jsonify({'error': 'Bu öğrenci numarası zaten kayıtlı'}), 400
    
    # Yeni kullanıcı oluştur
    user = User(
        email=data['email'],
        first_name=data['first_name'],
        last_name=data['last_name'],
        student_number=data['student_number'],
        department=data['department'],
        phone=data.get('phone'),
        role='student'
    )
    user.set_password(data['password'])
    
    db.session.add(user)
    db.session.commit()
    
    # Token oluştur
    access_token = create_access_token(
        identity=user.id,
        additional_claims={'role': user.role}
    )
    
    return jsonify({
        'message': 'Kayıt başarılı',
        'access_token': access_token,
        'user': user.to_dict()
    }), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    """Giriş (Öğrenci, Kulüp Yöneticisi, SKS Admin)"""
    data = request.get_json()
    
    if not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email ve şifre gerekli'}), 400
    
    user = User.query.filter_by(email=data['email']).first()
    
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Email veya şifre hatalı'}), 401
    
    if not user.is_active:
        return jsonify({'error': 'Hesabınız aktif değil'}), 403
    
    # Token oluştur
    access_token = create_access_token(
        identity=user.id,
        additional_claims={'role': user.role}
    )
    
    return jsonify({
        'message': 'Giriş başarılı',
        'access_token': access_token,
        'user': user.to_dict()
    }), 200


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Mevcut kullanıcı bilgisi"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'Kullanıcı bulunamadı'}), 404
    
    return jsonify({'user': user.to_dict()}), 200


@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Şifre değiştirme"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    data = request.get_json()
    
    if not user.check_password(data.get('old_password', '')):
        return jsonify({'error': 'Mevcut şifre yanlış'}), 400
    
    if not data.get('new_password'):
        return jsonify({'error': 'Yeni şifre gerekli'}), 400
    
    user.set_password(data['new_password'])
    db.session.commit()
    
    return jsonify({'message': 'Şifre başarıyla değiştirildi'}), 200

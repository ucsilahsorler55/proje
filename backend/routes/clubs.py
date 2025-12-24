from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models import db, Club, ClubMembership, User, Notification, Announcement
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


@clubs_bp.route('/my-club', methods=['GET'])
@jwt_required()
def get_my_club():
    """Giriş yapan kullanıcının yönettiği kulübü getir"""
    user_id = int(get_jwt_identity())
    
    # Kullanıcının başkan olduğu kulübü bul
    membership = ClubMembership.query.filter_by(
        user_id=user_id,
        role='president',
        status='active'
    ).first()
    
    if not membership:
        # Belki başkan yardımcısıdır?
        membership = ClubMembership.query.filter_by(
            user_id=user_id,
            role='vice_president',
            status='active'
        ).first()
    
    if not membership:
        return jsonify({'error': 'Yönettiğiniz bir kulüp bulunamadı'}), 404
        
    club = Club.query.get(membership.club_id)
    
    club_data = club.to_dict(include_members=True)
    
    # Kurucu üye bilgisini ekle
    founder = User.query.get(club.founder_id) if club.founder_id else None
    if founder:
        club_data['founder_name'] = f"{founder.first_name} {founder.last_name}"
        
    # Üye listesini ekle (Sadece aktif üyeler)
    members = []
    for membership in club.memberships:
        if membership.status == 'active':
            members.append({
                'id': membership.user.id,
                'first_name': membership.user.first_name,
                'last_name': membership.user.last_name,
                'student_number': membership.user.student_number,
                'department': membership.user.department,
                'role': membership.role,
                'joined_at': membership.joined_at.isoformat()
            })
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
    
    # Yeni üyelik - Varsayılan olarak 'pending' (beklemede)
    membership = ClubMembership(
        club_id=club_id,
        user_id=user_id,
        role='member',
        status='pending'
    )
    
    db.session.add(membership)
    db.session.commit()
    
    return jsonify({'message': 'Kulübe katılım başvurunuz alındı. Onay bekleniyor.'}), 201


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


@clubs_bp.route('/my-club/applications', methods=['GET'])
@jwt_required()
def get_club_applications():
    """Kulübün bekleyen üyelik başvurularını getir"""
    user_id = int(get_jwt_identity())
    
    # Kullanıcının yetkili olduğu kulübü bul
    membership = ClubMembership.query.filter(
        ClubMembership.user_id == user_id,
        ClubMembership.status == 'active',
        ClubMembership.role.in_(['president', 'vice_president'])
    ).first()
    
    if not membership:
        return jsonify({'error': 'Yönetici olduğunuz bir kulüp bulunamadı'}), 404
        
    applications = ClubMembership.query.filter_by(
        club_id=membership.club_id,
        status='pending'
    ).all()
    
    result = []
    for app in applications:
        user_data = app.user.to_dict()
        result.append({
            'id': app.id,
            'user': user_data,
            'applied_at': app.joined_at.isoformat()
        })
        
    return jsonify(result), 200


@clubs_bp.route('/applications/<int:membership_id>/approve', methods=['POST'])
@jwt_required()
def approve_application(membership_id):
    """Üyelik başvurusunu onayla"""
    user_id = int(get_jwt_identity())
    
    application = ClubMembership.query.get_or_404(membership_id)
    
    # İşlemi yapan kişinin bu kulübün yöneticisi olup olmadığını kontrol et
    admin_membership = ClubMembership.query.filter(
        ClubMembership.club_id == application.club_id,
        ClubMembership.user_id == user_id,
        ClubMembership.status == 'active',
        ClubMembership.role.in_(['president', 'vice_president'])
    ).first()
    
    if not admin_membership:
        return jsonify({'error': 'Bu işlem için yetkiniz yok'}), 403
        
    application.status = 'active'
    
    # Bildirim gönder
    notification = Notification(
        user_id=application.user_id,
        title="Kulüp Üyeliği Onaylandı",
        message=f"{application.club.name} kulübüne üyeliğiniz onaylandı.",
        is_read=False
    )
    db.session.add(notification)
    db.session.commit()
    
    return jsonify({'message': 'Üyelik onaylandı'}), 200


@clubs_bp.route('/applications/<int:membership_id>/reject', methods=['POST'])
@jwt_required()
def reject_application(membership_id):
    """Üyelik başvurusunu reddet"""
    user_id = int(get_jwt_identity())
    
    application = ClubMembership.query.get_or_404(membership_id)
    
    # İşlemi yapan kişinin bu kulübün yöneticisi olup olmadığını kontrol et
    admin_membership = ClubMembership.query.filter(
        ClubMembership.club_id == application.club_id,
        ClubMembership.user_id == user_id,
        ClubMembership.status == 'active',
        ClubMembership.role.in_(['president', 'vice_president'])
    ).first()
    
    if not admin_membership:
        return jsonify({'error': 'Bu işlem için yetkiniz yok'}), 403
        
    # Başvuruyu sil veya reddedildi olarak işaretle (Kullanıcı silsin istiyoruz genelde ama burada reject de tutabiliriz)
    # Şimdilik silelim ki tekrar başvuru yapabilsin veya modelde 'rejected' enum varsa onu kullanalım.
    # Enum check: models.py -> status = db.Column(db.Enum('pending', 'active', 'inactive', name='membership_status'), default='active')
    # Enum içinde 'rejected' yok. O yüzden direkt silelim ya da inactive yapalım?
    # En temiz yöntem başvuruyu silmektir veya inactive yapmaktır. Inactive yaparsak listede çıkmaz.
    # Ancak inactive yaparsak tekrar başvuramaz (unique constraint varsa? yoksa sorun yok).
    # Kodun yukarısında "Zaten üye mi?" kontrolü var. Inactive ise tekrar aktif ediyor.
    # O yüzden reddedilen başvuruyu silmek (delete) en mantıklısı, böylece tekrar başvurabilir.
    
    club_name = application.club.name
    student_id = application.user_id
    
    db.session.delete(application)
    
    # Bildirim gönder
    notification = Notification(
        user_id=student_id,
        title="Kulüp Üyeliği Reddedildi",
        message=f"{club_name} kulübüne üyelik başvurunuz reddedildi.",
        is_read=False
    )
    db.session.add(notification)
    
    db.session.commit()
    
    return jsonify({'message': 'Üyelik başvurusu reddedildi'}), 200

@clubs_bp.route('/my-club/announce', methods=['POST'])
@jwt_required()
def create_announcement():
    """Kulüp duyurusu yap ve üyelere bildirim gönder"""
    user_id = int(get_jwt_identity())
    
    # Kullanıcının yönetici olduğu kulübü bul
    membership = ClubMembership.query.filter(
        ClubMembership.user_id == user_id,
        ClubMembership.status == 'active',
        ClubMembership.role.in_(['president', 'vice_president'])
    ).first()
    
    if not membership:
        return jsonify({'error': 'Yönetici olduğunuz bir kulüp bulunamadı'}), 403
        
    data = request.get_json()
    if not data or 'title' not in data or 'message' not in data: # Frontend uses 'message' but model uses 'content' probably, let's check or map it.
        # Frontend sends: title, message. Model: title, content.
        return jsonify({'error': 'Başlık ve mesaj zorunludur'}), 400
        
    # Duyuru oluştur
    announcement = Announcement(
        club_id=membership.club_id,
        title=data['title'],
        content=data['message'],
        created_by=user_id,
        is_global=False
    )
    db.session.add(announcement)
    
    # Üyelere bildirim gönder
    club = Club.query.get(membership.club_id)
    active_memberships = ClubMembership.query.filter_by(
        club_id=membership.club_id,
        status='active'
    ).all()
    
    count = 0
    for member in active_memberships:
        # Kendisine bildirim gönderme (opsiyonel, genelde gönderilmez)
        if member.user_id != user_id:
            notification = Notification(
                user_id=member.user_id,
                title=f"Duyuru: {club.name}",
                message=f"{data['title']}\n\n{data['message']}",
                is_read=False
            )
            db.session.add(notification)
            count += 1
            
    db.session.commit()
    
    return jsonify({
        'message': f'Duyuru yayınlandı ve {count} üyeye bildirim gönderildi.'
    }), 201

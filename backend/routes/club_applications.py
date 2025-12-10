from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, ClubApplication, ClubApplicationFounder, User, Notification
from datetime import datetime

club_applications_bp = Blueprint('club_applications', __name__)


@club_applications_bp.route('', methods=['POST'])
@jwt_required()
def create_application():
    """Yeni kulüp kurma başvurusu oluştur"""
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    
    # Validasyon
    if not data.get('club_name') or not data.get('description'):
        return jsonify({'error': 'Kulüp adı ve açıklaması zorunludur'}), 400
    
    # Aynı isimde bekleyen başvuru var mı kontrol et
    existing = ClubApplication.query.filter_by(
        club_name=data['club_name'], 
        status='pending'
    ).first()
    if existing:
        return jsonify({'error': 'Bu isimde bekleyen bir başvuru zaten var'}), 400
    
    # Başvuruyu oluştur
    # Eğer kurucu üyeler varsa önce onların onayı beklenir (pending_founders)
    # Yoksa direkt SKS onayına düşer (pending)
    initial_status = 'pending_founders' if data.get('founder_ids') else 'pending'
    
    application = ClubApplication(
        applicant_id=current_user_id,
        club_name=data['club_name'],
        description=data['description'],
        status=initial_status
    )
    db.session.add(application)
    db.session.flush()  # ID almak için
    
    # Kurucu üyeleri ekle (varsa)
    founder_ids = data.get('founder_ids', [])
    for user_id in founder_ids:
        try:
            user_id = int(user_id)
        except ValueError:
            continue
            
        if user_id != current_user_id:  # Başvuran zaten kurucu
            user = User.query.get(user_id)
            if user:
                founder = ClubApplicationFounder(
                    application_id=application.id,
                    user_id=user_id
                )
                db.session.add(founder)
                
                # Kurucu adayına bildirim gönder
                notification = Notification(
                    user_id=user_id,
                    title='Kurucu Üye Daveti',
                    message=f'{application.applicant.first_name} {application.applicant.last_name} sizi "{application.club_name}" kulübünün kurucu üyesi olarak davet etti.'
                )
                db.session.add(notification)
    
    db.session.commit()
    
    return jsonify({
        'message': 'Başvuru başarıyla oluşturuldu',
        'application': application.to_dict(include_founders=True)
    }), 201


@club_applications_bp.route('', methods=['GET'])
@jwt_required()
def get_applications():
    """Başvuruları listele (kullanıcı rolüne göre)"""
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    
    if user.role == 'sks_admin':
        # SKS tüm başvuruları görebilir
        status = request.args.get('status', 'pending')
        if status == 'all':
            applications = ClubApplication.query.order_by(ClubApplication.created_at.desc()).all()
        else:
            applications = ClubApplication.query.filter_by(status=status).order_by(ClubApplication.created_at.desc()).all()
    else:
        # Öğrenci sadece kendi başvurularını görebilir
        applications = ClubApplication.query.filter_by(applicant_id=current_user_id).order_by(ClubApplication.created_at.desc()).all()
    
    return jsonify([app.to_dict(include_founders=True) for app in applications]), 200


@club_applications_bp.route('/<int:application_id>', methods=['GET'])
@jwt_required()
def get_application(application_id):
    """Tek bir başvuruyu getir"""
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    
    application = ClubApplication.query.get_or_404(application_id)
    
    # Yetki kontrolü
    if user.role != 'sks_admin' and application.applicant_id != current_user_id:
        # Kurucu üye mi kontrol et
        is_founder = ClubApplicationFounder.query.filter_by(
            application_id=application_id, 
            user_id=current_user_id
        ).first()
        if not is_founder:
            return jsonify({'error': 'Bu başvuruyu görme yetkiniz yok'}), 403
    
    return jsonify(application.to_dict(include_founders=True)), 200


@club_applications_bp.route('/<int:application_id>/review', methods=['POST'])
@jwt_required()
def review_application(application_id):
    """SKS başvuruyu onaylar veya reddeder"""
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    
    if user.role != 'sks_admin':
        return jsonify({'error': 'Bu işlem için yetkiniz yok'}), 403
    
    application = ClubApplication.query.get_or_404(application_id)
    
    if application.status != 'pending':
        return jsonify({'error': 'Bu başvuru zaten değerlendirilmiş'}), 400
    
    data = request.get_json()
    action = data.get('action')  # 'approve' veya 'reject'
    
    if action == 'approve':
        application.status = 'approved'
        
        # Yeni kulüp oluştur
        from models import Club, ClubMembership
        
        new_club = Club(
            name=application.club_name,
            description=application.description,
            status='active',
            founding_date=datetime.utcnow().date(),
            founder_id=application.applicant_id,
            is_active=True
        )
        db.session.add(new_club)
        db.session.flush() # ID almak için
        
        # Kulüp için Yönetici Hesabı Oluştur
        import random
        import string
        
        # Basit slug oluşturma (Türkçe karakter temizliği basitçe)
        def slugify(text):
            text = text.lower().replace(' ', '')
            replacements = {'ı': 'i', 'ğ': 'g', 'ü': 'u', 'ş': 's', 'ö': 'o', 'ç': 'c'}
            for tr, eng in replacements.items():
                text = text.replace(tr, eng)
            return ''.join(c for c in text if c.isalnum())
            
        club_email = f"{slugify(application.club_name)}@gmail.com"
        
        # Rastgele şifre (6 karakter)
        club_password = ''.join(random.choices(string.ascii_letters + string.digits, k=6))
        
        # Kulüp Admin Kullanıcısı
        club_user = User(
            email=club_email,
            first_name=application.club_name,
            last_name='Yönetim',
            student_number=f'CLUB{new_club.id}', # Benzersiz olması için
            department='Kulüp Yönetimi',
            role='club_admin'
        )
        club_user.set_password(club_password)
        db.session.add(club_user)
        db.session.flush()

        # Kulüp hesabını yönetici olarak ekle
        club_membership = ClubMembership(
            club_id=new_club.id,
            user_id=club_user.id,
            role='president',
            status='active'
        )
        db.session.add(club_membership)

        # Başvuran öğrenciyi de başkan olarak ekle
        president = ClubMembership(
            club_id=new_club.id,
            user_id=application.applicant_id,
            role='president',
            status='active'
        )
        db.session.add(president)
        
        # Kurucu üyeleri ekle
        for founder in application.founders:
            if founder.status == 'accepted':
                member = ClubMembership(
                    club_id=new_club.id,
                    user_id=founder.user_id,
                    role='member',
                    status='active'
                )
                db.session.add(member)
        
        notification_message = (
            f'"{application.club_name}" kulüp başvurunuz onaylandı!\n\n'
            f'Kulüp Yönetim Hesabı Oluşturuldu:\n'
            f'Email: {club_email}\n'
            f'Şifre: {club_password}\n\n'
            'Lütfen bu bilgilerle giriş yaparak şifrenizi değiştirin.'
        )
        
    elif action == 'reject':
        application.status = 'rejected'
        application.rejection_reason = data.get('reason', '')
        notification_message = f'"{application.club_name}" kulüp başvurunuz reddedildi. Sebep: {application.rejection_reason}'
    else:
        return jsonify({'error': 'Geçersiz işlem'}), 400
    
    application.reviewed_at = datetime.utcnow()
    application.reviewed_by = current_user_id
    
    # Başvurana bildirim gönder
    notification = Notification(
        user_id=application.applicant_id,
        title='Kulüp Başvurusu Sonucu',
        message=notification_message
    )
    db.session.add(notification)
    
    db.session.commit()
    
    return jsonify({
        'message': 'Başvuru değerlendirildi',
        'application': application.to_dict(include_founders=True)
    }), 200


@club_applications_bp.route('/founders/<int:founder_id>/respond', methods=['POST'])
@jwt_required()
def respond_to_invitation(founder_id):
    """Kurucu üye daveti kabul/red"""
    current_user_id = int(get_jwt_identity())
    
    founder = ClubApplicationFounder.query.get_or_404(founder_id)
    
    if founder.user_id != current_user_id:
        return jsonify({'error': 'Bu davete cevap verme yetkiniz yok'}), 403
    
    if founder.status != 'pending':
        return jsonify({'error': 'Bu davete zaten cevap verilmiş'}), 400
    
    data = request.get_json()
    action = data.get('action')  # 'accept' veya 'reject'
    
    if action == 'accept':
        founder.status = 'accepted'
        message = 'Davet kabul edildi'
    elif action == 'reject':
        founder.status = 'rejected'
        message = 'Davet reddedildi'
    else:
        return jsonify({'error': 'Geçersiz işlem'}), 400
    
    db.session.commit()
    
    # Eğer kabul edildiyse, diğer kurucuların durumunu kontrol et
    if action == 'accept':
        application = founder.application
        all_accepted = True
        for f in application.founders:
            if f.status != 'accepted':
                all_accepted = False
                break
        
        if all_accepted:
            application.status = 'pending'
            # Başvuru sahibine bildirim
            notif = Notification(
                user_id=application.applicant_id,
                title='Tüm Onaylar Tamamlandı',
                message=f'"{application.club_name}" başvurunuz için tüm kurucu üyeler onay verdi. Başvurunuz SKS onayına gönderildi.'
            )
            db.session.add(notif)
            db.session.commit()
    
    return jsonify({'message': message, 'founder': founder.to_dict()}), 200


@club_applications_bp.route('/my-invitations', methods=['GET'])
@jwt_required()
def get_my_invitations():
    """Kullanıcıya gelen kurucu üye davetleri"""
    current_user_id = int(get_jwt_identity())
    
    invitations = ClubApplicationFounder.query.filter_by(user_id=current_user_id).all()
    
    result = []
    for inv in invitations:
        data = inv.to_dict()
        data['application'] = inv.application.to_dict()
        result.append(data)
    
    return jsonify(result), 200


@club_applications_bp.route('/search-users', methods=['GET'])
@jwt_required()
def search_users():
    """Kurucu üye seçimi için kullanıcı ara"""
    query = request.args.get('q', '')
    
    if len(query) < 2:
        return jsonify([]), 200
    
    users = User.query.filter(
        User.role == 'student',
        (User.first_name.ilike(f'%{query}%') | 
         User.last_name.ilike(f'%{query}%') | 
         User.email.ilike(f'%{query}%') |
         User.student_number.ilike(f'%{query}%'))
    ).limit(10).all()
    
    return jsonify([{
        'id': u.id,
        'name': f'{u.first_name} {u.last_name}',
        'email': u.email,
        'student_number': u.student_number
    } for u in users]), 200

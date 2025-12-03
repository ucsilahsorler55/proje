from app import create_app
from models import db, User
from werkzeug.security import generate_password_hash

app = create_app()

with app.app_context():
    # Test kullanıcılarını bul ve şifrelerini güncelle
    test_emails = ['admin@university.edu', 'student1@university.edu', 'student2@university.edu']
    
    for email in test_emails:
        user = User.query.filter_by(email=email).first()
        if user:
            user.set_password('admin123')
            print(f"✓ {email} şifresi güncellendi")
        else:
            print(f"✗ {email} bulunamadı")
    
    db.session.commit()
    print("\n✅ Tüm şifreler başarıyla güncellendi!")
    print("Şimdi şu bilgilerle giriş yapabilirsiniz:")
    print("Email: admin@university.edu veya student1@university.edu")
    print("Şifre: admin123")

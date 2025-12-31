from app import create_app, db
from models import User


def seed_database():
    app = create_app()
    with app.app_context():
        # Önce mevcut admin varsa kontrol et
        admin = User.query.filter_by(email="admin@university.edu").first()

        if admin:
            print("Admin kullanıcısı zaten mevcut. Şifresi güncelleniyor...")
            admin.set_password("admin123")
            admin.role = "sks_admin"  # Rolünün doğru olduğundan emin olalım
        else:
            print("Admin kullanıcısı oluşturuluyor...")
            admin = User(
                email="admin@university.edu",
                first_name="Admin",
                last_name="User",
                role="sks_admin",
                student_number="ADMIN001",  # Unique constraint hatası almamak için
                department="SKS",
                is_active=True,
            )
            admin.set_password("admin123")
            db.session.add(admin)

        try:
            db.session.commit()
            print("İşlem başarılı!")
            print("Email: admin@university.edu")
            print("Şifre: admin123")
        except Exception as e:
            db.session.rollback()
            print(f"Hata oluştu: {e}")


if __name__ == "__main__":
    seed_database()

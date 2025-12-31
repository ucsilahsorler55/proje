import unittest
import json
import warnings
from config import Config
from app import create_app
from models import db, User, Club, ClubApplication


class TestConfig(Config):
    """Test ortamı konfigürasyonu - Gerçek DB yerine bellekte çalışan DB kullanılır"""

    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"  # RAM üzerinde geçici veritabanı
    WTF_CSRF_ENABLED = False
    JWT_SECRET_KEY = "test-secret-key"


class ClubSystemTestCase(unittest.TestCase):
    """Üniversite Kulüp Sistemi Ana Test Sınıfı"""

    def setUp(self):
        """Her testten önce çalışır: Uygulamayı ve DB'yi ayağa kaldır"""
        self.app = create_app(config_class=TestConfig)
        self.client = self.app.test_client()

        with self.app.app_context():
            db.create_all()
            self.create_test_users()

    def tearDown(self):
        """Her testten sonra çalışır: DB'yi temizle"""
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def create_test_users(self):
        """Test için gerekli Admin ve Öğrenci hesaplarını oluşturur"""
        # 1. SKS Admin Oluştur
        admin = User(
            email="admin@university.edu",
            first_name="SKS",
            last_name="Admin",
            student_number="ADMIN001",
            role="sks_admin",
            department="Rektörlük",
        )
        admin.set_password("admin123")
        db.session.add(admin)

        # 2. Standart Öğrenci Oluştur (Şifresi daha hashlenmemiş, API ile kayıt olacak)
        db.session.commit()

    def get_auth_headers(self, email, password):
        """Yardımcı Fonksiyon: Giriş yapıp Token döner"""
        response = self.client.post(
            "/api/auth/login", json={"email": email, "password": password}
        )
        data = json.loads(response.data)
        return {"Authorization": f"Bearer {data['access_token']}"}

    # --- TEST SENARYOLARI (TEST CASES) ---

    def test_01_student_registration_and_login(self):
        """TC-001 & TC-003: Öğrenci Kayıt ve Giriş Testi"""
        print("\n--> Test 1: Öğrenci Kayıt ve Giriş İşlemleri Test Ediliyor...")

        # 1. Kayıt Ol (Register)
        payload = {
            "email": "ali@test.edu",
            "password": "password123",
            "first_name": "Ali",
            "last_name": "Veli",
            "student_number": "2025001",
            "department": "Bilgisayar Müh.",
        }
        res = self.client.post("/api/auth/register", json=payload)
        self.assertEqual(res.status_code, 201)
        print("    [Başarılı] Öğrenci kaydı oluşturuldu.")

        # 2. Giriş Yap (Login)
        res_login = self.client.post(
            "/api/auth/login", json={"email": "ali@test.edu", "password": "password123"}
        )
        self.assertEqual(res_login.status_code, 200)
        data = json.loads(res_login.data)
        self.assertIn("access_token", data)
        print("    [Başarılı] Giriş yapıldı ve Token alındı.")

    def test_02_create_club_application(self):
        """TC-009: Yeni Kulüp Kurma Başvurusu Testi"""
        print("\n--> Test 2: Kulüp Kurma Başvurusu Test Ediliyor...")

        # Önce bir öğrenci oluşturup token alalım
        self.client.post(
            "/api/auth/register",
            json={
                "email": "clubfounder@test.edu",
                "password": "123",
                "first_name": "Mehmet",
                "last_name": "Can",
                "student_number": "2025999",
                "department": "Yazılım",
            },
        )
        headers = self.get_auth_headers("clubfounder@test.edu", "123")

        # Kulüp Başvurusu Yap
        club_payload = {
            "club_name": "Yapay Zeka Kulübü",
            "description": "AI üzerine çalışmalar.",
            "advisor_name": "Prof. Dr. X",  # Backend validasyonu için gerekebilir
            "advisor_email": "hoca@uni.edu",
        }

        # NOT: club_applications.py endpoint'i '/api/club-applications'
        res = self.client.post(
            "/api/club-applications", json=club_payload, headers=headers
        )

        self.assertEqual(res.status_code, 201)
        data = json.loads(res.data)
        self.assertEqual(data["application"]["status"], "pending")
        print("    [Başarılı] Kulüp başvurusu SKS onayına gönderildi.")

    def test_03_sks_admin_approve_club(self):
        """TC-018: SKS Admin Kulüp Onaylama Testi"""
        print("\n--> Test 3: SKS Personeli Kulüp Onaylama Test Ediliyor...")

        # 1. Adım: Önce veritabanına manuel bir başvuru ekleyelim (Setup)
        with self.app.app_context():
            student = User(
                email="std@u.edu",
                first_name="S",
                last_name="T",
                role="student",
                password_hash="hash",
            )
            db.session.add(student)
            db.session.commit()

            app_req = ClubApplication(
                applicant_id=student.id,
                club_name="Siber Güvenlik Kulübü",
                description="Security.",
                status="pending",
            )
            db.session.add(app_req)
            db.session.commit()
            app_id = app_req.id

        # 2. Adım: Admin olarak giriş yap
        admin_headers = self.get_auth_headers("admin@university.edu", "admin123")

        # 3. Adım: Başvuruyu onayla (approve)
        # Endpoint: /api/club-applications/<id>/review
        res = self.client.post(
            f"/api/club-applications/{app_id}/review",
            json={"action": "approve"},
            headers=admin_headers,
        )

        self.assertEqual(res.status_code, 200)
        print("    [Başarılı] Admin kulüp başvurusunu onayladı.")

        # 4. Adım: Kulübün gerçekten oluştuğunu doğrula
        with self.app.app_context():
            new_club = Club.query.filter_by(name="Siber Güvenlik Kulübü").first()
            self.assertIsNotNone(new_club)
            self.assertEqual(new_club.status, "active")
            print("    [Başarılı] Kulüp 'active' statüsünde veritabanında oluşturuldu.")


if __name__ == "__main__":
    unittest.main()

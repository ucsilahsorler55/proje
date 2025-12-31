from app import create_app, db


def init_db():
    app = create_app()
    with app.app_context():
        print("Veritabanı tabloları oluşturuluyor...")
        db.create_all()
        print("Tablolar başarıyla oluşturuldu!")


if __name__ == "__main__":
    init_db()

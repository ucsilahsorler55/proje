from app import create_app, db
from models import User

app = create_app()

with app.app_context():
    # Tüm kullanıcıların şifresini '123456' yap (kolaylık olsun diye)
    users = User.query.all()
    for user in users:
        user.set_password('123456')
        print(f"User {user.email} password reset to 123456")
    db.session.commit()

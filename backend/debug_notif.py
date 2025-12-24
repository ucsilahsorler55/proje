from app import create_app
from models import Notification, User

app = create_app()
with app.app_context():
    # Get latest notification
    n = Notification.query.order_by(Notification.id.desc()).first()
    if n:
        print(f"ID: {n.id}")
        print(f"Title: {n.title}")
        print(f"Message Raw: {repr(n.message)}")
    else:
        print("No notifications found")

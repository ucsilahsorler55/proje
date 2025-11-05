from .auth import auth_bp
from .system import system_bp

def register_routes(app):
    app.register_blueprint(auth_bp)
    app.register_blueprint(system_bp)

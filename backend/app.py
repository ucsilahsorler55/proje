from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config
from models import db

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # CORS ayarları
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    # Database ve JWT init
    db.init_app(app)
    jwt = JWTManager(app)
    
    # Blueprints (routes)
    from routes.auth import auth_bp
    from routes.clubs import clubs_bp
    from routes.users import users_bp
    from routes.events import events_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(clubs_bp, url_prefix='/api/clubs')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    app.register_blueprint(events_bp, url_prefix='/api/events')
    
    # Health check
    @app.route('/api/health')
    def health():
        return jsonify({'status': 'healthy', 'message': 'Club System API is running'}), 200
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({'error': 'Internal server error'}), 500
    
    return app

if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        db.create_all()  # Tabloları oluştur
    app.run(debug=True, host='0.0.0.0', port=5000)

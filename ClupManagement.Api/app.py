from flask import Flask
from config import JWT_SECRET_KEY
from extensions import cors, jwt
from routes import register_routes

app = Flask(__name__)
app.config["JWT_SECRET_KEY"] = JWT_SECRET_KEY
app.config["JSON_AS_ASCII"] = False

# Genişleme için uzantılar
cors.init_app(app)
jwt.init_app(app)

# Tüm blueprintleri bağla
register_routes(app)

# Basit root endpoint
@app.route("/")
def home():
    return "merhaba", 200

if __name__ == "__main__":
    app.run(debug=True)

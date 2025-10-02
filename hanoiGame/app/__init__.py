# app/__init__.py
from flask import Flask

def create_app():
    """Fungsi pabrik untuk membuat aplikasi Flask."""
    app = Flask(__name__)

    # Konfigurasi rahasia, nanti bisa dipindah ke file config.py
    app.config['SECRET_KEY'] = 'ini-adalah-rahasia-sangat-penting'

    # Mendaftarkan Blueprint (kita akan buat di routes.py)
    from . import routes
    app.register_blueprint(routes.main_bp)

    return app
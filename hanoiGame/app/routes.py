# app/routes.py
from flask import Blueprint, render_template

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def home():
    # Kita kembalikan ke template, karena tes sudah berhasil
    return render_template('index.html')

# PASTIKAN FUNGSI INI ADA DAN BENAR
@main_bp.route('/about')
def about():
    return "<h1>Ini Halaman About</h1>"
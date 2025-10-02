# app/routes.py
from flask import Blueprint, render_template, url_for

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def home():
    # INI ADALAH BARIS YANG PALING KRUSIAL
    # Harus mengembalikan render_template('index.html')
    return render_template('index.html')

@main_bp.route('/about')
def about():
    return '<h1>Ini Halaman About</h1><br><a href="' + url_for('main.home') + '">Kembali ke Beranda</a>'
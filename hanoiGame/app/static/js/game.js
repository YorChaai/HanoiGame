// static/js/game.js

// --- Terjemahan Konstanta dari Pygame ---
const LEBAR_LAYAR = 800;
const TINGGI_LAYAR = 600;
const WARNA_BACKGROUND = '#1e1e28';
const WARNA_MENARA = '#8B4513'; // (139, 69, 19) -> hex
const TINGGI_MENARA = 300;
const LEBAR_ALAS_MENARA = 180;
const TEBAL_MENARA = 10;

// Posisi menara (x, y)
const posisi_menara = [
    [LEBAR_LAYAR / 4, TINGGI_LAYAR - 150],
    [LEBAR_LAYAR / 2, TINGGI_LAYAR - 150],
    [3 * LEBAR_LAYAR / 4, TINGGI_LAYAR - 150]
];

// --- Terjemahan Fungsi Menggambar dari Pygame ---

// Dapatkan elemen canvas dan "kuas" untuk menggambar
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function drawBackground() {
    ctx.fillStyle = WARNA_BACKGROUND;
    ctx.fillRect(0, 0, LEBAR_LAYAR, TINGGI_LAYAR);
}

// Fungsi gambar_menara() dari Pygame diterjemahkan ke sini
function drawTowers() {
    ctx.fillStyle = WARNA_MENARA;
    for (const [x, y] of posisi_menara) {
        // Gambar alas
        ctx.fillRect(x - LEBAR_ALAS_MENARA / 2, y, LEBAR_ALAS_MENARA, 20);
        // Gambar tiang
        ctx.fillRect(x - TEBAL_MENARA / 2, y - TINGGI_MENARA, TEBAL_MENARA, TINGGI_MENARA);
    }
}

// Fungsi utama untuk menggambar seluruh scene
function draw() {
    drawBackground();
    drawTowers();
}

// Panggil fungsi draw sekali untuk memulai
draw();
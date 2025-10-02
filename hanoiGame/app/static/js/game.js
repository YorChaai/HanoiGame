// static/js/game.js

// --- 1. KONSTANTA ---
const LEBAR_LAYAR = 800;
const TINGGI_LAYAR = 600;
const WARNA_BACKGROUND = '#1e1e28';
const WARNA_MENARA = '#8B4513';
const WARNA_PIRINGAN = [
    '#FF6347', '#FFA500', '#FFD700',
    '#32CD32', '#1E90FF', '#8A2BE2', '#FF1493'
];
const WARNA_TEKS = '#FFFFFF';

const TINGGI_MENARA = 300;
const LEBAR_ALAS_MENARA = 180;
const TEBAL_MENARA = 10;
const PIRINGAN_TINGGI = 30;
const PIRINGAN_LEBAR_MIN = 50;
const PIRINGAN_LEBAR_MAX = 150;

const posisi_menara = [
    [LEBAR_LAYAR / 4, TINGGI_LAYAR - 150],
    [LEBAR_LAYAR / 2, TINGGI_LAYAR - 150],
    [3 * LEBAR_LAYAR / 4, TINGGI_LAYAR - 150]
];

// --- 2. VARIABEL STATE ---
let canvas, ctx;
let jumlah_piringan_saat_ini = 3;
let menara = [[], [], []];
let gerakan = 0;
let game_selesai = false;

let piringan_yang_dipilih = null;
let menara_asal = null;
let offset_mouse_x = 0;
let offset_mouse_y = 0;
let isDragging = false;

let mouse_pos = { x: 0, y: 0 };

let current_level = 1; // level saat ini
let highestUnlockedLevel = 1; // level tertinggi yang terbuka

// --- 3. SETUP ---
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');

    // Ambil progress dari localStorage (kalau ada)
    const savedProgress = localStorage.getItem("hanoi_unlocked");
    if (savedProgress) {
        highestUnlockedLevel = parseInt(savedProgress);
    }

    updateLevelButtons();

    // Awal: tampilkan menu
    document.getElementById("menu").style.display = "block";
    document.getElementById("gameUI").style.display = "none";
    document.getElementById("winScreen").style.display = "none";

    // Event listener mouse
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);

    // Tombol Next
    document.getElementById("btnNext").onclick = () => {
        if (current_level < 7) {
            startLevel(current_level + 1);
        } else {
            goHome();
        }
    };

    gameLoop();
}

function startLevel(disks) {
    current_level = disks;
    jumlah_piringan_saat_ini = disks;

    resetGame(disks);

    document.getElementById("menu").style.display = "none";
    document.getElementById("winScreen").style.display = "none";
    document.getElementById("gameUI").style.display = "block";
}

function goHome() {
    document.getElementById("menu").style.display = "block";
    document.getElementById("gameUI").style.display = "none";
    document.getElementById("winScreen").style.display = "none";
    canvas.style.display = "none";
}

// --- 4. GAME LOGIC ---
function resetGame(num_disks) {
    menara = [[], [], []];
    for (let i = num_disks; i > 0; i--) {
        menara[0].push(i);
    }
    gerakan = 0;
    game_selesai = false;
    piringan_yang_dipilih = null;
    menara_asal = null;
    isDragging = false;
    jumlah_piringan_saat_ini = num_disks;

    canvas.style.display = "block";
}

function getMousePos(event) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: (event.clientX - rect.left) * (canvas.width / rect.width),
        y: (event.clientY - rect.top) * (canvas.height / rect.height)
    };
}

function getTowerFromPosition(x) {
    for (let i = 0; i < posisi_menara.length; i++) {
        const [menara_x, _] = posisi_menara[i];
        if (Math.abs(x - menara_x) < LEBAR_ALAS_MENARA / 2) {
            return i;
        }
    }
    return null;
}

function checkWinCondition() {
    if (menara[2].length === jumlah_piringan_saat_ini) {
        game_selesai = true;

        // Unlock level berikutnya kalau belum kebuka
        if (current_level === highestUnlockedLevel && current_level < 7) {
            highestUnlockedLevel++;
            localStorage.setItem("hanoi_unlocked", highestUnlockedLevel);
        }

        updateLevelButtons();

        document.getElementById("gameUI").style.display = "none";
        document.getElementById("winScreen").style.display = "flex";
    }
}

// --- 5. DRAW ---
function drawBackground() {
    ctx.fillStyle = WARNA_BACKGROUND;
    ctx.fillRect(0, 0, LEBAR_LAYAR, TINGGI_LAYAR);
}

function drawTowers() {
    ctx.fillStyle = WARNA_MENARA;
    for (const [x, y] of posisi_menara) {
        ctx.fillRect(x - LEBAR_ALAS_MENARA / 2, y, LEBAR_ALAS_MENARA, 20);
        ctx.fillRect(x - TEBAL_MENARA / 2, y - TINGGI_MENARA, TEBAL_MENARA, TINGGI_MENARA);
    }
}

CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.beginPath();
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
    return this;
};

function drawDisks() {
    for (let i = 0; i < menara.length; i++) {
        const tumpukan = menara[i];
        const [menara_x, menara_y] = posisi_menara[i];

        for (let j = 0; j < tumpukan.length; j++) {
            const ukuran_piringan = tumpukan[j];
            if (isDragging && i === menara_asal && j === tumpukan.length - 1) continue;

            const lebar_piringan = PIRINGAN_LEBAR_MIN +
                (ukuran_piringan - 1) * (PIRINGAN_LEBAR_MAX - PIRINGAN_LEBAR_MIN) /
                (jumlah_piringan_saat_ini - 1);
            const piringan_x = menara_x - lebar_piringan / 2;
            const piringan_y_pos = menara_y - (j + 1) * PIRINGAN_TINGGI;

            ctx.fillStyle = WARNA_PIRINGAN[ukuran_piringan - 1];
            ctx.roundRect(piringan_x, piringan_y_pos, lebar_piringan, PIRINGAN_TINGGI, 5).fill();
        }
    }

    if (isDragging && piringan_yang_dipilih !== null) {
        const lebar_piringan = PIRINGAN_LEBAR_MIN +
            (piringan_yang_dipilih - 1) * (PIRINGAN_LEBAR_MAX - PIRINGAN_LEBAR_MIN) /
            (jumlah_piringan_saat_ini - 1);
        const piringan_x = mouse_pos.x - lebar_piringan / 2 - offset_mouse_x;
        const piringan_y_pos = mouse_pos.y - PIRINGAN_TINGGI / 2 - offset_mouse_y;

        ctx.fillStyle = WARNA_PIRINGAN[piringan_yang_dipilih - 1];
        ctx.roundRect(piringan_x, piringan_y_pos, lebar_piringan, PIRINGAN_TINGGI, 5).fill();
    }
}

function drawText() {
    ctx.fillStyle = WARNA_TEKS;
    ctx.font = '24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Gerakan: ${gerakan}`, 20, 40);
}

function draw() {
    if (!game_selesai && canvas.style.display !== "none") {
        drawBackground();
        drawTowers();
        drawDisks();
        drawText();
    }
}

// --- 6. HANDLER EVENT ---
function handleMouseDown(event) {
    if (game_selesai) return;

    mouse_pos = getMousePos(event);
    const indeks_menara = getTowerFromPosition(mouse_pos.x);

    if (indeks_menara !== null && menara[indeks_menara].length > 0) {
        isDragging = true;
        piringan_yang_dipilih = menara[indeks_menara][menara[indeks_menara].length - 1];
        menara_asal = indeks_menara;

        const [menara_x, menara_y] = posisi_menara[indeks_menara];
        offset_mouse_x = mouse_pos.x - menara_x;
        offset_mouse_y = mouse_pos.y - (menara_y - menara[indeks_menara].length * PIRINGAN_TINGGI);
    }
}

function handleMouseMove(event) {
    mouse_pos = getMousePos(event);
}

function handleMouseUp(event) {
    if (!isDragging || piringan_yang_dipilih === null) {
        isDragging = false;
        return;
    }

    mouse_pos = getMousePos(event);
    const indeks_menara_tujuan = getTowerFromPosition(mouse_pos.x);

    if (indeks_menara_tujuan !== null) {
        if (
            menara[indeks_menara_tujuan].length === 0 ||
            menara[indeks_menara_tujuan][menara[indeks_menara_tujuan].length - 1] > piringan_yang_dipilih
        ) {
            menara[menara_asal].pop();
            menara[indeks_menara_tujuan].push(piringan_yang_dipilih);
            gerakan++;
            checkWinCondition();
        }
    }

    isDragging = false;
    piringan_yang_dipilih = null;
    menara_asal = null;
}

// --- 7. UPDATE LEVEL BUTTONS ---
function updateLevelButtons() {
    const buttons = document.querySelectorAll(".levelBtn");
    buttons.forEach((btn, index) => {
        const level = index + 1;
        if (level <= highestUnlockedLevel) {
            btn.disabled = false;
        } else {
            btn.disabled = true;
        }
    });
}

// --- 8. GAME LOOP ---
function gameLoop() {
    draw();
    requestAnimationFrame(gameLoop);
}

// --- 9. MULAI ---
window.onload = init;

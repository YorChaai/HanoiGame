// static/js/game.js

// --- KONFIG LEVEL ---
const LEVELS = [3, 4, 5, 6, 7]; // index 0..4 => disks
const MAX_LEVEL_INDEX = LEVELS.length; // 5

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
// jumlah_piringan_saat_ini akan diatur oleh resetGame
let jumlah_piringan_saat_ini = LEVELS[0]; 
let menara = [[], [], []];
let gerakan = 0;
let game_selesai = false;

let piringan_yang_dipilih = null;
let menara_asal = null;
let offset_mouse_x = 0;
let offset_mouse_y = 0;
let isDragging = false;

let mouse_pos = { x: 0, y: 0 };

// current_level: stored/used as level index (1..MAX_LEVEL_INDEX)
let current_level = 1;
// highestUnlockedLevel: stored/used as level index (1..MAX_LEVEL_INDEX)
let highestUnlockedLevel = 1;

// --- HELPERS LEVEL/DISK ---
// Fungsi ini tetap berguna
function diskCountFromLevelIndex(idx) {
    // idx adalah 1-based, array adalah 0-based
    return LEVELS[idx - 1];
}

// Fungsi ini masih berguna untuk kompatibilitas, tetapi akan lebih jarang digunakan
function levelIndexFromArg(arg) {
    const n = Number(arg);
    if (!Number.isFinite(n)) return 1;
    // Jika argumen adalah indeks level yang valid (1-5), gunakan itu
    if (n >= 1 && n <= MAX_LEVEL_INDEX && Number.isInteger(n)) return n;
    // Jika argumen adalah jumlah piringan (3-7), cari indeksnya
    const idx = LEVELS.indexOf(n);
    if (idx >= 0) return idx + 1; // convert disk count -> index
    return 1; // Default ke level 1
}

// --- 3. SETUP ---
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');

    // Load progress (handle old format yang mungkin menyimpan jumlah piringan)
    const savedUnlockedRaw = localStorage.getItem("hanoi_unlocked");
    if (savedUnlockedRaw) {
        const v = Number(savedUnlockedRaw);
        if (!Number.isNaN(v)) {
            // Jika yang disimpan adalah jumlah piringan (3-7), konversi ke indeks
            if (LEVELS.indexOf(v) >= 0) {
                highestUnlockedLevel = LEVELS.indexOf(v) + 1;
            } 
            // Jika yang disimpan sudah indeks (1-5), gunakan langsung
            else if (v >= 1 && v <= MAX_LEVEL_INDEX) {
                highestUnlockedLevel = Math.floor(v);
            }
        }
    } else {
        highestUnlockedLevel = 1; // Default hanya level 1 yang terbuka
    }

    const savedCurrentRaw = localStorage.getItem("hanoi_current_level");
    if (savedCurrentRaw) {
        const v = Number(savedCurrentRaw);
        if (!Number.isNaN(v)) {
            if (LEVELS.indexOf(v) >= 0) {
                current_level = LEVELS.indexOf(v) + 1;
            } else if (v >= 1 && v <= MAX_LEVEL_INDEX) {
                current_level = Math.floor(v);
            }
        }
    } else {
        current_level = 1;
    }

    // Pastikan level yang terbuka setidaknya sama dengan level saat ini
    highestUnlockedLevel = Math.max(highestUnlockedLevel, current_level);

    // Siapkan UI tombol & status
    updateLevelButtons();

    document.getElementById("menu").style.display = "block";
    document.getElementById("gameUI").style.display = "none";
    document.getElementById("winScreen").style.display = "none";

    // Mouse events
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);

    // Tombol Next di layar menang
    const btnNext = document.getElementById("btnNext");
    if (btnNext) {
        btnNext.onclick = () => {
            const nextLevel = current_level + 1;
            if (nextLevel <= MAX_LEVEL_INDEX) {
                startLevel(nextLevel);
            } else {
                goHome();
            }
        };
    }

    gameLoop();
}

// --- 4. START / HOME ---
function startLevel(levelIndex) {
    // Pastikan levelIndex adalah angka yang valid
    const lvl = levelIndexFromArg(levelIndex);

    // Jangan izinkan memulai level yang terkunci
    if (lvl > highestUnlockedLevel) {
        alert("Level ini terkunci! Selesaikan level sebelumnya dulu.");
        return;
    }

    current_level = lvl;
    localStorage.setItem("hanoi_current_level", current_level);

    jumlah_piringan_saat_ini = diskCountFromLevelIndex(current_level);
    resetGame(jumlah_piringan_saat_ini);

    document.getElementById("menu").style.display = "none";
    document.getElementById("winScreen").style.display = "none";
    document.getElementById("gameUI").style.display = "block";
    canvas.style.display = "block";
}

function goHome() {
    // Simpan level saat ini
    localStorage.setItem("hanoi_current_level", String(current_level));
    // Pastikan tombol mencerminkan level yang terbuka
    updateLevelButtons();

    document.getElementById("menu").style.display = "block";
    document.getElementById("gameUI").style.display = "none";
    document.getElementById("winScreen").style.display = "none";
    canvas.style.display = "none";
}

// --- 5. GAME LOGIC ---
function resetGame(num_disks) {
    menara = [[], [], []];
    for (let i = num_disks; i > 0; i--) menara[0].push(i);
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
        if (Math.abs(x - menara_x) < LEBAR_ALAS_MENARA / 2) return i;
    }
    return null;
}

function checkWinCondition() {
    if (menara[2].length === jumlah_piringan_saat_ini) {
        game_selesai = true;

        // Buka level berikutnya jika kita menyelesaikan level tertinggi yang terbuka
        if (current_level >= highestUnlockedLevel && highestUnlockedLevel < MAX_LEVEL_INDEX) {
            highestUnlockedLevel = current_level + 1;
            localStorage.setItem("hanoi_unlocked", String(highestUnlockedLevel));
        }

        // Simpan level saat ini
        localStorage.setItem("hanoi_current_level", String(current_level));

        updateLevelButtons();

        // Tampilkan layar menang dan konfigurasi visibilitas tombol Next
        document.getElementById("gameUI").style.display = "none";
        const win = document.getElementById("winScreen");
        win.style.display = "flex";

        const btnNext = document.getElementById("btnNext");
        if (btnNext) {
            // Tampilkan Next hanya jika level berikutnya ada
            const nextIdx = current_level + 1;
            if (nextIdx <= MAX_LEVEL_INDEX) {
                btnNext.style.display = "inline-block";
            } else {
                btnNext.style.display = "none";
            }
        }
    }
}

// --- 6. DRAW HELPERS ---
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

    const levelLabel = `Level ${current_level} (${diskCountFromLevelIndex(current_level)} Disk)`;
    ctx.textAlign = 'center';
    ctx.fillText(levelLabel, LEBAR_LAYAR / 2, 40);
    ctx.textAlign = 'left';
}

function draw() {
    if (!game_selesai && canvas && canvas.style.display !== "none") {
        drawBackground();
        drawTowers();
        drawDisks();
        drawText();
    }
}

// --- 7. HANDLER EVENT ---
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

// --- 8. UPDATE LEVEL BUTTONS (menu) ---
function updateLevelButtons() {
    const buttons = document.querySelectorAll(".levelBtn");
    buttons.forEach((btn, index) => {
        const levelIdx = index + 1; // 1-based
        const diskCount = LEVELS[levelIdx - 1]; // 0-based

        if (levelIdx <= highestUnlockedLevel) {
            btn.disabled = false;
            btn.textContent = `Level ${levelIdx} (${diskCount} Disk)`;
        } else {
            btn.disabled = true;
            btn.textContent = `Level ${levelIdx} (${diskCount} Disk) 🔒`;
        }
        // Setel ulang onclick untuk memastikan menggunakan indeks level
        btn.onclick = () => startLevel(levelIdx);
    });

    // Sorot level saat ini di menu (visual)
    buttons.forEach((b, i) => {
        if (i + 1 === current_level) {
            b.style.outline = "2px solid #32ff32";
        } else {
            b.style.outline = "none";
        }
    });
}

// --- 9. GAME LOOP ---
function gameLoop() {
    draw();
    requestAnimationFrame(gameLoop);
}

// --- 10. RESET PROGRESS (BARU) ---
function resetAllProgress() {
    // Tampilkan dialog konfirmasi
    const isConfirmed = confirm("Apakah Anda yakin ingin mereset semua progress? Semua level yang telah dibuka akan dikunci kembali.");
    
    if (isConfirmed) {
        // Hapus data dari localStorage
        localStorage.removeItem("hanoi_unlocked");
        localStorage.removeItem("hanoi_current_level");
        
        // Reset variabel state ke nilai awal
        current_level = 1;
        highestUnlockedLevel = 1;
        
        // Perbarui UI tombol level
        updateLevelButtons();
        
        // Opsional: Tampilkan pesan singkat
        alert("Progress telah direset. Game akan dimulai ulang dari Level 1.");
    }
}

// --- 11. STARTUP ---
window.onload = init;
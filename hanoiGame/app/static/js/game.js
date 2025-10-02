// ===================== KONSTANTA =====================
const LEBAR_LAYAR = 800;
const TINGGI_LAYAR = 600;
const WARNA_BACKGROUND = '#1e1e28';
const WARNA_MENARA = '#8B4513';
const WARNA_PIRINGAN = ['#FF6347','#FFA500','#FFD700','#32CD32','#1E90FF','#8A2BE2','#FF1493'];
const WARNA_TEKS = '#FFFFFF';
const WARNA_TEKS_MENANG = '#32FF32';

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

// ===================== VARIABEL STATE =====================
let canvas, ctx;
let jumlah_piringan_saat_ini = 3;
let menara = [[], [], []];
let gerakan = 0;
let game_selesai = false;
let game_state = "HOME"; // HOME | PLAYING | WIN

let piringan_yang_dipilih = null;
let menara_asal = null;
let offset_mouse_x = 0;
let offset_mouse_y = 0;
let isDragging = false;
let mouse_pos = {x:0,y:0};

let level_index = 0;
const levels_data = [
  { name: "Level 1", disks: 3, unlocked: true },
  { name: "Level 2", disks: 4, unlocked: false },
  { name: "Level 3", disks: 5, unlocked: false },
  { name: "Level 4", disks: 6, unlocked: false },
  { name: "Level 5", disks: 7, unlocked: false }
];

// ===================== INISIALISASI =====================
function init() {
  canvas = document.getElementById("gameCanvas");
  ctx = canvas.getContext("2d");
  showMenu();
  gameLoop();
}

function showMenu() {
  document.getElementById("menu").style.display = "block";
  document.getElementById("gameUI").style.display = "none";
  document.getElementById("winScreen").style.display = "none";
  game_state = "HOME";
  buatMenuLevel();
}

function startLevel(idx) {
  level_index = idx;
  jumlah_piringan_saat_ini = levels_data[idx].disks;
  resetGame(jumlah_piringan_saat_ini);

  document.getElementById("menu").style.display = "none";
  document.getElementById("gameUI").style.display = "block";
  document.getElementById("winScreen").style.display = "none";

  game_state = "PLAYING";
}

function goHome() {
  showMenu();
}

// ===================== MENU LEVEL =====================
function buatMenuLevel() {
  const container = document.getElementById("levelButtons");
  container.innerHTML = "";
  levels_data.forEach((lvl, idx) => {
    const btn = document.createElement("button");
    btn.innerText = lvl.unlocked ? `${lvl.name} (${lvl.disks} Disk)` 
                                 : `🔒 ${lvl.name} (${lvl.disks} Disk)`;
    btn.disabled = !lvl.unlocked;
    btn.onclick = () => startLevel(idx);
    container.appendChild(btn);
  });
}

// ===================== GAME LOGIC =====================
function resetGame(num_disks) {
  menara = [[], [], []];
  for (let i = num_disks; i > 0; i--) menara[0].push(i);
  gerakan = 0;
  game_selesai = false;
  piringan_yang_dipilih = null;
  menara_asal = null;
  isDragging = false;

  // pasang listener
  canvas.onmousedown = handleMouseDown;
  canvas.onmousemove = handleMouseMove;
  canvas.onmouseup   = handleMouseUp;
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
    const [menara_x] = posisi_menara[i];
    if (Math.abs(x - menara_x) < LEBAR_ALAS_MENARA / 2) return i;
  }
  return null;
}

function checkWinCondition() {
  if (menara[2].length === jumlah_piringan_saat_ini) {
    game_selesai = true;
    game_state = "WIN";
    if (level_index + 1 < levels_data.length) {
      levels_data[level_index + 1].unlocked = true;
    }
    showWinScreen();
  }
}

// ===================== DRAWING =====================
CanvasRenderingContext2D.prototype.roundRect = function(x,y,w,h,r){
  if(w<2*r) r=w/2; if(h<2*r) r=h/2;
  this.beginPath();
  this.moveTo(x+r,y);
  this.arcTo(x+w,y,x+w,y+h,r);
  this.arcTo(x+w,y+h,x,y+h,r);
  this.arcTo(x,y+h,x,y,r);
  this.arcTo(x,y,x+w,y,r);
  this.closePath();
  return this;
};

function drawBackground() {
  ctx.fillStyle = WARNA_BACKGROUND;
  ctx.fillRect(0,0,LEBAR_LAYAR,TINGGI_LAYAR);
}

function drawTowers() {
  ctx.fillStyle = WARNA_MENARA;
  for(const [x,y] of posisi_menara){
    ctx.fillRect(x-LEBAR_ALAS_MENARA/2,y,LEBAR_ALAS_MENARA,20);
    ctx.fillRect(x-TEBAL_MENARA/2,y-TINGGI_MENARA,TEBAL_MENARA,TINGGI_MENARA);
  }
}

function drawDisks() {
  for (let i=0;i<menara.length;i++) {
    const tumpukan = menara[i];
    const [menara_x, menara_y] = posisi_menara[i];
    for (let j=0;j<tumpukan.length;j++) {
      const ukuran = tumpukan[j];
      if(isDragging && i===menara_asal && j===tumpukan.length-1) continue;

      const lebar = PIRINGAN_LEBAR_MIN + (ukuran-1)*(PIRINGAN_LEBAR_MAX-PIRINGAN_LEBAR_MIN)/(jumlah_piringan_saat_ini-1);
      const x = menara_x - lebar/2;
      const y = menara_y - (j+1)*PIRINGAN_TINGGI;

      ctx.fillStyle = WARNA_PIRINGAN[ukuran-1];
      ctx.roundRect(x,y,lebar,PIRINGAN_TINGGI,5).fill();
    }
  }

  if(isDragging && piringan_yang_dipilih!==null){
    const lebar = PIRINGAN_LEBAR_MIN + (piringan_yang_dipilih-1)*(PIRINGAN_LEBAR_MAX-PIRINGAN_LEBAR_MIN)/(jumlah_piringan_saat_ini-1);
    const x = mouse_pos.x - lebar/2 - offset_mouse_x;
    const y = mouse_pos.y - PIRINGAN_TINGGI/2 - offset_mouse_y;
    ctx.fillStyle = WARNA_PIRINGAN[piringan_yang_dipilih-1];
    ctx.roundRect(x,y,lebar,PIRINGAN_TINGGI,5).fill();
  }
}

function drawText() {
  ctx.fillStyle = WARNA_TEKS;
  ctx.font = '24px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`Gerakan: ${gerakan}`,20,40);
}

function draw() {
  if (game_state==="PLAYING") {
    drawBackground();
    drawTowers();
    drawDisks();
    drawText();
  }
}

function showWinScreen() {
  document.getElementById("menu").style.display = "none";
  document.getElementById("gameUI").style.display = "none";
  document.getElementById("winScreen").style.display = "block";

  document.getElementById("btnNext").onclick = () => {
    if (level_index+1 < levels_data.length) startLevel(level_index+1);
    else goHome();
  };
}

// ===================== EVENT =====================
function handleMouseDown(event){
  if(game_selesai) return;
  mouse_pos = getMousePos(event);
  const idx = getTowerFromPosition(mouse_pos.x);
  if(idx!==null && menara[idx].length>0){
    isDragging = true;
    piringan_yang_dipilih = menara[idx][menara[idx].length-1];
    menara_asal = idx;
    const [menara_x, menara_y] = posisi_menara[idx];
    offset_mouse_x = mouse_pos.x - menara_x;
    offset_mouse_y = mouse_pos.y - (menara_y - menara[idx].length*PIRINGAN_TINGGI);
  }
}
function handleMouseMove(event){ mouse_pos = getMousePos(event); }
function handleMouseUp(event){
  if(!isDragging || piringan_yang_dipilih===null){ isDragging=false; return; }
  mouse_pos = getMousePos(event);
  const idxTujuan = getTowerFromPosition(mouse_pos.x);
  if(idxTujuan!==null){
    if(menara[idxTujuan].length===0 || menara[idxTujuan][menara[idxTujuan].length-1]>piringan_yang_dipilih){
      menara[menara_asal].pop();
      menara[idxTujuan].push(piringan_yang_dipilih);
      gerakan++;
      checkWinCondition();
    }
  }
  isDragging=false; piringan_yang_dipilih=null; menara_asal=null;
}

// ===================== LOOP =====================
function gameLoop(){
  draw();
  requestAnimationFrame(gameLoop);
}

window.onload = init;

import pygame
import sys
from enum import Enum

# --- Inisialisasi dan Konstanta ---
pygame.init()

# Ukuran layar
LEBAR_LAYAR = 800
TINGGI_LAYAR = 600
screen = pygame.display.set_mode((LEBAR_LAYAR, TINGGI_LAYAR))
pygame.display.set_caption("Game Menara Hanoi - Level")

# Warna
WARNA_BACKGROUND = (30, 30, 40)
WARNA_MENARA = (139, 69, 19)
WARNA_PIRINGAN = [(255, 99, 71), (255, 165, 0), (255, 215, 0), (50, 205, 50), (30, 144, 255), (138, 43, 226), (255, 20, 147)]
WARNA_TEKS = (255, 255, 255)
WARNA_TOMBOL = (70, 130, 180)
WARNA_TOMBOL_AKTIF = (100, 149, 237)
WARNA_TOMBOL_TERKUNCI = (80, 80, 80)
WARNA_TEKS_MENANG = (50, 255, 50)

# Pengaturan game
TINGGI_MENARA = 300
LEBAR_ALAS_MENARA = 180
TEBAL_MENARA = 10
PIRINGAN_TINGGI = 30
PIRINGAN_LEBAR_MIN = 50
PIRINGAN_LEBAR_MAX = 150

# Posisi menara (x, y)
posisi_menara = [
    (LEBAR_LAYAR // 4, TINGGI_LAYAR - 150),
    (LEBAR_LAYAR // 2, TINGGI_LAYAR - 150),
    (3 * LEBAR_LAYAR // 4, TINGGI_LAYAR - 150)
]

# Font
font = pygame.font.Font(None, 36)
font_besar = pygame.font.Font(None, 72)
font_kecil = pygame.font.Font(None, 24)

# --- Enum untuk State Game ---
class GameState(Enum):
    HOME = 1
    PLAYING = 2
    LEVEL_COMPLETE = 3

# --- Kelas untuk Tombol ---
class Button:
    def __init__(self, x, y, width, height, text, color, text_color=WARNA_TEKS):
        self.rect = pygame.Rect(x, y, width, height)
        self.text = text
        self.color = color
        self.text_color = text_color
        self.is_hovered = False

    def draw(self, surface):
        color = WARNA_TOMBOL_AKTIF if self.is_hovered else self.color
        pygame.draw.rect(surface, color, self.rect, border_radius=10)
        text_surface = font.render(self.text, True, self.text_color)
        text_rect = text_surface.get_rect(center=self.rect.center)
        surface.blit(text_surface, text_rect)

    def handle_event(self, event):
        if event.type == pygame.MOUSEMOTION:
            self.is_hovered = self.rect.collidepoint(event.pos)
        if event.type == pygame.MOUSEBUTTONDOWN:
            if self.rect.collidepoint(event.pos):
                return True
        return False

# --- Data Level ---
levels_data = [
    {"name": "Level 1", "disks": 3, "unlocked": True},
    {"name": "Level 2", "disks": 4, "unlocked": False},
    {"name": "Level 3", "disks": 5, "unlocked": False},
    {"name": "Level 4", "disks": 6, "unlocked": False},
    {"name": "Level 5", "disks": 7, "unlocked": False},
]

# --- Variabel Global Game ---
game_state = GameState.HOME
level_sekarang_idx = 0
jumlah_piringan_saat_ini = levels_data[0]["disks"]

# Variabel untuk game logic
menara = [[], [], []]
gerakan = 0
game_selesai = False

# Variabel untuk drag and drop
piringan_yang_dipilih = None
menara_asal = None
offset_mouse_x = 0
offset_mouse_y = 0

# --- Fungsi Bantuan ---

def reset_game(num_disks):
    """Mereset variabel game untuk memulai level baru."""
    global menara, gerakan, game_selesai, piringan_yang_dipilih, menara_asal, jumlah_piringan_saat_ini
    menara = [[], [], []]
    for i in range(num_disks, 0, -1):
        menara[0].append(i)
    gerakan = 0
    game_selesai = False
    piringan_yang_dipilih = None
    menara_asal = None
    jumlah_piringan_saat_ini = num_disks

def draw_home_screen():
    """Menggambar layar utama (pemilihan level)."""
    screen.fill(WARNA_BACKGROUND)
    title = font_besar.render("PILIH LEVEL", True, WARNA_TEKS)
    screen.blit(title, (LEBAR_LAYAR // 2 - title.get_width() // 2, 50))

    for i, level in enumerate(levels_data):
        x = 150 + (i % 3) * 200
        y = 200 + (i // 3) * 150
        
        if level["unlocked"]:
            color = WARNA_TOMBOL
            text = f'{level["name"]}\n({level["disks"]} Piringan)'
        else:
            color = WARNA_TOMBOL_TERKUNCI
            text = "TERKUNCI\n---"
        
        # Gambar tombol level
        button_rect = pygame.Rect(x, y, 150, 100)
        pygame.draw.rect(screen, color, button_rect, border_radius=10)
        
        # Gambar teks di tombol
        lines = text.split('\n')
        for j, line in enumerate(lines):
            text_surface = font_kecil.render(line, True, WARNA_TEKS)
            text_rect = text_surface.get_rect(center=(button_rect.centerx, button_rect.centery - 10 + j * 25))
            screen.blit(text_surface, text_rect)

def draw_game_screen():
    """Menggambar layar permainan."""
    screen.fill(WARNA_BACKGROUND)
    gambar_menara()
    gambar_piringan()
    gambar_teks_game()
    if game_selesai:
        gambar_teks_menang()

def draw_level_complete_screen():
    """Menggambar layar setelah menyelesaikan level."""
    screen.fill(WARNA_BACKGROUND)
    teks_menang = font_besar.render("LEVEL SELESAI!", True, WARNA_TEKS_MENANG)
    screen.blit(teks_menang, (LEBAR_LAYAR // 2 - teks_menang.get_width() // 2, TINGGI_LAYAR // 2 - 100))
    
    teks_gerakan = font.render(f"Selesai dalam {gerakan} gerakan", True, WARNA_TEKS)
    screen.blit(teks_gerakan, (LEBAR_LAYAR // 2 - teks_gerakan.get_width() // 2, TINGGI_LAYAR // 2))

def gambar_menara():
    """Menggambar 3 menara."""
    for x, y in posisi_menara:
        pygame.draw.rect(screen, WARNA_MENARA, (x - LEBAR_ALAS_MENARA // 2, y, LEBAR_ALAS_MENARA, 20))
        pygame.draw.rect(screen, WARNA_MENARA, (x - TEBAL_MENARA // 2, y - TINGGI_MENARA, TEBAL_MENARA, TINGGI_MENARA))

def gambar_piringan():
    """Menggambar semua piringan di menara."""
    for i, tumpukan in enumerate(menara):
        menara_x, menara_y = posisi_menara[i]
        for j, ukuran_piringan in enumerate(tumpukan):
            if piringan_yang_dipilih is not None and i == menara_asal and j == len(tumpukan) - 1:
                continue

            lebar_piringan = PIRINGAN_LEBAR_MIN + (ukuran_piringan - 1) * (PIRINGAN_LEBAR_MAX - PIRINGAN_LEBAR_MIN) / (jumlah_piringan_saat_ini - 1)
            piringan_x = menara_x - lebar_piringan / 2
            piringan_y = menara_y - (j + 1) * PIRINGAN_TINGGI
            warna = WARNA_PIRINGAN[ukuran_piringan - 1]
            pygame.draw.rect(screen, warna, (piringan_x, piringan_y, lebar_piringan, PIRINGAN_TINGGI), border_radius=5)

    if piringan_yang_dipilih is not None:
        mouse_x, mouse_y = pygame.mouse.get_pos()
        lebar_piringan = PIRINGAN_LEBAR_MIN + (piringan_yang_dipilih - 1) * (PIRINGAN_LEBAR_MAX - PIRINGAN_LEBAR_MIN) / (jumlah_piringan_saat_ini - 1)
        piringan_x = mouse_x - lebar_piringan / 2 - offset_mouse_x
        piringan_y = mouse_y - PIRINGAN_TINGGI / 2 - offset_mouse_y
        warna = WARNA_PIRINGAN[piringan_yang_dipilih - 1]
        pygame.draw.rect(screen, warna, (piringan_x, piringan_y, lebar_piringan, PIRINGAN_TINGGI), border_radius=5)

def gambar_teks_game():
    """Menggambar teks informasi di layar game."""
    teks_gerakan = font.render(f"Gerakan: {gerakan}", True, WARNA_TEKS)
    screen.blit(teks_gerakan, (20, 20))
    
    level_name = levels_data[level_sekarang_idx]["name"]
    teks_level = font.render(level_name, True, WARNA_TEKS)
    screen.blit(teks_level, (LEBAR_LAYAR // 2 - teks_level.get_width() // 2, 20))

def gambar_teks_menang():
    """Menggambar overlay teks menang di layar game."""
    s = pygame.Surface((LEBAR_LAYAR, TINGGI_LAYAR), pygame.SRCALPHA)
    s.fill((0, 0, 0, 128))
    screen.blit(s, (0, 0))
    teks_menang = font_besar.render("ANDA MENANG!", True, WARNA_TEKS_MENANG)
    screen.blit(teks_menang, (LEBAR_LAYAR // 2 - teks_menang.get_width() // 2, TINGGI_LAYAR // 2 - 50))

def dapatkan_menara_dari_posisi(x):
    """Mendapatkan indeks menara berdasarkan posisi x mouse."""
    for i, (menara_x, _) in enumerate(posisi_menara):
        if abs(x - menara_x) < LEBAR_ALAS_MENARA // 2:
            return i
    return None

def cek_kondisi_menang():
    """Memeriksa apakah pemain sudah menang."""
    global game_selesai, game_state
    if len(menara[2]) == jumlah_piringan_saat_ini:
        game_selesai = True
        # Delay sedikit sebelum pindah ke layar kemenangan
        pygame.time.wait(500) 
        game_state = GameState.LEVEL_COMPLETE

# --- Inisialisasi Tombol ---
tombol_home_game = Button(20, 60, 100, 40, "Home", WARNA_TOMBOL)
tombol_lanjut = Button(LEBAR_LAYAR // 2 - 75, TINGGI_LAYAR // 2 + 50, 150, 50, "Lanjut", WARNA_TOMBOL)
tombol_home_complete = Button(LEBAR_LAYAR // 2 - 75, TINGGI_LAYAR // 2 + 120, 150, 50, "Home", WARNA_TOMBOL)

# --- Loop Utama Game ---
running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

        # --- Event Handling berdasarkan State ---
        if game_state == GameState.HOME:
            if event.type == pygame.MOUSEBUTTONDOWN:
                mouse_x, mouse_y = event.pos
                for i, level in enumerate(levels_data):
                    x = 150 + (i % 3) * 200
                    y = 200 + (i // 3) * 150
                    button_rect = pygame.Rect(x, y, 150, 100)
                    if button_rect.collidepoint(mouse_x, mouse_y) and level["unlocked"]:
                        level_sekarang_idx = i
                        reset_game(level["disks"])
                        game_state = GameState.PLAYING

        elif game_state == GameState.PLAYING:
            if tombol_home_game.handle_event(event):
                game_state = GameState.HOME

            if not game_selesai:
                if event.type == pygame.MOUSEBUTTONDOWN:
                    mouse_x, mouse_y = event.pos
                    indeks_menara = dapatkan_menara_dari_posisi(mouse_x)
                    if indeks_menara is not None and menara[indeks_menara]:
                        piringan_yang_dipilih = menara[indeks_menara][-1]
                        menara_asal = indeks_menara
                        lebar_piringan = PIRINGAN_LEBAR_MIN + (piringan_yang_dipilih - 1) * (PIRINGAN_LEBAR_MAX - PIRINGAN_LEBAR_MIN) / (jumlah_piringan_saat_ini - 1)
                        offset_mouse_x = mouse_x - posisi_menara[indeks_menara][0]
                        offset_mouse_y = mouse_y - (posisi_menara[indeks_menara][1] - (len(menara[indeks_menara])) * PIRINGAN_TINGGI)

                if event.type == pygame.MOUSEBUTTONUP and piringan_yang_dipilih is not None:
                    mouse_x, _ = event.pos
                    indeks_menara_tujuan = dapatkan_menara_dari_posisi(mouse_x)
                    if indeks_menara_tujuan is not None:
                        if not menara[indeks_menara_tujuan] or menara[indeks_menara_tujuan][-1] > piringan_yang_dipilih:
                            menara[menara_asal].pop()
                            menara[indeks_menara_tujuan].append(piringan_yang_dipilih)
                            gerakan += 1
                            cek_kondisi_menang()
                    piringan_yang_dipilih = None
                    menara_asal = None

        elif game_state == GameState.LEVEL_COMPLETE:
            if tombol_lanjut.handle_event(event):
                # Buka level berikutnya
                if level_sekarang_idx + 1 < len(levels_data):
                    levels_data[level_sekarang_idx + 1]["unlocked"] = True
                    level_sekarang_idx += 1
                    reset_game(levels_data[level_sekarang_idx]["disks"])
                    game_state = GameState.PLAYING
                else:
                    # Jika ini level terakhir, kembali ke home
                    game_state = GameState.HOME
            
            if tombol_home_complete.handle_event(event):
                game_state = GameState.HOME

    # --- Drawing berdasarkan State ---
    if game_state == GameState.HOME:
        draw_home_screen()
    elif game_state == GameState.PLAYING:
        draw_game_screen()
        tombol_home_game.draw(screen)
    elif game_state == GameState.LEVEL_COMPLETE:
        draw_level_complete_screen()
        if level_sekarang_idx + 1 < len(levels_data):
            tombol_lanjut.draw(screen)
        tombol_home_complete.draw(screen)

    pygame.display.flip()

# --- Keluar dari Game ---
pygame.quit()
sys.exit()
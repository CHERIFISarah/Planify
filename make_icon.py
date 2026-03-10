# Genere apple-touch-icon.png - Planify
import math
from PIL import Image, ImageDraw, ImageFont

SIZE = 512
CORNER = 112

# ── Couleurs ──────────────────────────────────────────────────────────────────
def h(c):
    c = c.lstrip('#')
    return tuple(int(c[i:i+2], 16) for i in (0, 2, 4))

def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))

# ── 1. Fond dégradé diagonal ─────────────────────────────────────────────────
img = Image.new('RGBA', (SIZE, SIZE), (0,0,0,0))
px  = img.load()
c1, c2, c3 = h('#CC7A92'), h('#A0486A'), h('#7A2E50')
for y in range(SIZE):
    for x in range(SIZE):
        t = (x + y) / (2 * SIZE)
        col = lerp(c1, c2, t/0.55) if t < 0.55 else lerp(c2, c3, (t-0.55)/0.45)
        px[x, y] = col + (255,)

# ── 2. Masque coins arrondis ──────────────────────────────────────────────────
mask = Image.new('L', (SIZE, SIZE), 0)
ImageDraw.Draw(mask).rounded_rectangle([0,0,SIZE-1,SIZE-1], radius=CORNER, fill=255)
img.putalpha(mask)

# ── 3. Fleur de cerisier ─────────────────────────────────────────────────────
# Chaque pétale est dessiné POINTANT VERS LE HAUT, puis pivoté de i×72°
# (correction du bug de double-rotation)
CX, CY      = 256, 148
PETAL_RX    = 20    # demi-largeur du pétale
PETAL_RY    = 46    # demi-hauteur du pétale
PETAL_DIST  = 50    # distance centre-fleur → centre-pétale

petal_col = [
    (255, 208, 225, 240),  # rose clair saturé
    (255, 185, 210, 235),  # rose moyen
]

flower = img.copy()
for i in range(5):
    deg = i * 72
    col = petal_col[i % 2]

    layer = Image.new('RGBA', (SIZE, SIZE), (0,0,0,0))
    d = ImageDraw.Draw(layer)
    # Pétale centré à (CX, CY - PETAL_DIST), orienté vertical
    d.ellipse([
        CX - PETAL_RX,
        CY - PETAL_DIST - PETAL_RY,
        CX + PETAL_RX,
        CY - PETAL_DIST + PETAL_RY,
    ], fill=col)
    # Rotation autour du centre de la fleur
    layer = layer.rotate(-deg, center=(CX, CY), resample=Image.BICUBIC)
    flower = Image.alpha_composite(flower, layer)

# Centre doré
ctr = Image.new('RGBA', (SIZE, SIZE), (0,0,0,0))
cd  = ImageDraw.Draw(ctr)
cd.ellipse([CX-17, CY-17, CX+17, CY+17], fill=(248, 210, 150, 255))
for sx, sy, sr in [(CX, CY-10, 4), (CX+9, CY-3, 3.5),
                   (CX+5, CY+8, 3), (CX-5, CY+8, 3), (CX-9, CY-3, 3.5)]:
    cd.ellipse([sx-sr, sy-sr, sx+sr, sy+sr], fill=(200, 128, 24, 255))
flower = Image.alpha_composite(flower, ctr)
img = flower

# ── 4. Texte ─────────────────────────────────────────────────────────────────
txt = Image.new('RGBA', (SIZE, SIZE), (0,0,0,0))
td  = ImageDraw.Draw(txt)

font_main = font_tag = None
for path in ["C:/Windows/Fonts/georgia.ttf",
             "C:/Windows/Fonts/georgiai.ttf",
             "C:/Windows/Fonts/times.ttf"]:
    try:
        font_main = ImageFont.truetype(path, 98)
        font_tag  = ImageFont.truetype(path, 32)
        break
    except Exception:
        pass
if font_main is None:
    font_main = font_tag = ImageFont.load_default()

def draw_centered(draw, y, text, font, fill):
    bb = draw.textbbox((0, 0), text, font=font)
    x  = (SIZE - (bb[2] - bb[0])) // 2 - bb[0]
    draw.text((x, y), text, font=font, fill=fill)

draw_centered(td, 262, "Planify",    font_main, (255, 255, 255, 255))
td.line([(148, 370), (364, 370)], fill=(255, 255, 255, 80), width=2)
draw_centered(td, 380, "ton espace", font_tag,  (255, 215, 232, 210))

img = Image.alpha_composite(img, txt)

# ── 5. Export PNG ─────────────────────────────────────────────────────────────
out = Image.new('RGB', (SIZE, SIZE), (122, 46, 80))
out.paste(img, mask=img.split()[3])

out.save(r"C:/Users/userlocal/Desktop/DSC S2/Projet/apple-touch-icon.png", optimize=True)
print("OK 512x512")
out.resize((180, 180), Image.LANCZOS).save(
    r"C:/Users/userlocal/Desktop/DSC S2/Projet/apple-touch-icon-180.png", optimize=True)
print("OK 180x180")

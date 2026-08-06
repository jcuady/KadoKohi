"""Remove near-black backgrounds from kukido product cookie webps for circular crops."""
from pathlib import Path

from PIL import Image

OUT = Path(__file__).resolve().parents[1] / "public" / "kukido"
NAMES = [
    "klassic.webp",
    "campfire.webp",
    "double-dark.webp",
    "birthday-bake.webp",
    "blondie.webp",
    "white-chocolate-walnut.webp",
]


def soft_matte_black(im: Image.Image) -> Image.Image:
    rgba = im.convert("RGBA")
    px = rgba.load()
    w, h = rgba.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            lum = (r + g + b) / 3
            if lum < 18:
                px[x, y] = (0, 0, 0, 0)
            elif lum < 42:
                alpha = int(max(0, min(255, (lum - 18) / 24 * 255)))
                px[x, y] = (r, g, b, alpha)
    return rgba


def main() -> None:
    for name in NAMES:
        path = OUT / name
        im = soft_matte_black(Image.open(path))
        bbox = im.getbbox()
        if bbox:
            im = im.crop(bbox)
        # pad to square for consistent circle crop
        side = max(im.size)
        canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
        ox = (side - im.size[0]) // 2
        oy = (side - im.size[1]) // 2
        canvas.paste(im, (ox, oy), im)
        canvas.save(path, "WEBP", quality=88, method=6)
        print(name, canvas.size, path.stat().st_size)


if __name__ == "__main__":
    main()

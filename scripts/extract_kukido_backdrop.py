"""Extract kukido section backdrop cookie + normalize logo-ready assets."""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "kukido"
ASSETS = Path(
    r"C:\Users\jcuad\.cursor\projects\c-Users-jcuad-OneDrive-Documents-kado-kohi-landing-page\assets"
)

# User-attached cookie menu flyer (royal blue + paper card + cookie behind)
FLYER = (
    ASSETS
    / "c__Users_jcuad_AppData_Roaming_Cursor_User_workspaceStorage_6ac046d7273c364a242959213e0d2d75_images_image-01c15f89-2f9b-440b-b316-0181c13ba0a0.png"
)


def remove_near_black(im: Image.Image, thresh: int = 28) -> Image.Image:
    rgba = im.convert("RGBA")
    px = rgba.load()
    w, h = rgba.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if r <= thresh and g <= thresh and b <= thresh:
                px[x, y] = (0, 0, 0, 0)
    return rgba


def soft_matte_black(im: Image.Image) -> Image.Image:
    """Softer edge matte for product shots on black."""
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
    OUT.mkdir(parents=True, exist_ok=True)

    # 1) Large backdrop cookie cutout from klassic product shot
    klassic = Image.open(OUT / "klassic.webp")
    cut = soft_matte_black(klassic)
    # trim transparent
    bbox = cut.getbbox()
    if bbox:
        cut = cut.crop(bbox)
    # export webp + png fallback
    cut_path = OUT / "backdrop-cookie.webp"
    cut.save(cut_path, "WEBP", quality=88, method=6)
    cut.save(OUT / "backdrop-cookie.png", "PNG", optimize=True)
    print("backdrop", cut.size, cut_path.stat().st_size)

    # 2) Store flyer reference for optional use / art direction
    if FLYER.exists():
        flyer = Image.open(FLYER).convert("RGB")
        flyer.save(OUT / "cookie-menu-flyer.webp", "WEBP", quality=86, method=6)
        print("flyer", flyer.size, (OUT / "cookie-menu-flyer.webp").stat().st_size)
    else:
        print("flyer missing", FLYER)


if __name__ == "__main__":
    main()

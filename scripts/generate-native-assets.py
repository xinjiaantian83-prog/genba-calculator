#!/usr/bin/env python3
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
MASTER_ICON = ROOT / "icons/icon.png"
DARK_BG = (0, 8, 5, 255)


def save_png(img, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, "PNG", optimize=True)


def load_master_icon():
    if not MASTER_ICON.exists():
        raise FileNotFoundError(f"Missing master icon: {MASTER_ICON}")

    icon = Image.open(MASTER_ICON).convert("RGBA")
    icon.thumbnail((1024, 1024), Image.Resampling.LANCZOS)

    canvas = Image.new("RGBA", (1024, 1024), DARK_BG)
    x = (1024 - icon.width) // 2
    y = (1024 - icon.height) // 2
    canvas.alpha_composite(icon, (x, y))
    return canvas


def resize_icon(icon, size, *, rgb=False):
    resized = icon.resize((size, size), Image.Resampling.LANCZOS)
    return resized.convert("RGB") if rgb else resized


def make_round_icon(icon, size):
    resized = resize_icon(icon, size)
    mask = Image.new("L", (size, size), 0)
    mask_draw = Image.new("L", (size, size), 0)
    from PIL import ImageDraw

    draw = ImageDraw.Draw(mask_draw)
    draw.ellipse((0, 0, size - 1, size - 1), fill=255)
    rounded = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    rounded.paste(resized, mask=mask_draw)
    return rounded


def generate_ios(icon):
    app_icon_dir = ROOT / "ios/App/App/Assets.xcassets/AppIcon.appiconset"
    save_png(resize_icon(icon, 1024, rgb=True), app_icon_dir / "AppIcon-512@2x.png")


def generate_android(icon):
    res = ROOT / "android/app/src/main/res"
    densities = {
        "mdpi": (48, 108),
        "hdpi": (72, 162),
        "xhdpi": (96, 216),
        "xxhdpi": (144, 324),
        "xxxhdpi": (192, 432),
    }

    for density, (legacy_size, foreground_size) in densities.items():
        mipmap = res / f"mipmap-{density}"
        save_png(resize_icon(icon, legacy_size), mipmap / "ic_launcher.png")
        save_png(make_round_icon(icon, legacy_size), mipmap / "ic_launcher_round.png")
        save_png(resize_icon(icon, foreground_size), mipmap / "ic_launcher_foreground.png")


if __name__ == "__main__":
    master = load_master_icon()
    generate_ios(master)
    generate_android(master)
    print("Generated iOS and Android icons from icons/icon.png.")

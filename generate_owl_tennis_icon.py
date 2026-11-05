import math
import os
from PIL import Image, ImageDraw, ImageFilter

def create_owl_tennis_icon(size=1024, transparent_bg=False):
    # High-resolution supersampling for crisp anti-aliasing
    scale = 2
    W = size * scale
    H = size * scale

    if transparent_bg:
        img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    else:
        img = Image.new("RGBA", (W, H), (7, 10, 17, 255))

    draw = ImageDraw.Draw(img)

    cx = W // 2
    cy = H // 2

    if not transparent_bg:
        # Subtle radial glow behind the owl
        for r in range(int(W * 0.45), 0, -8):
            alpha = int(45 * (1 - r / (W * 0.45)))
            draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(0, 240, 255, alpha))

        # Modern tennis court baseline accent
        court_accent_y = int(H * 0.78)
        draw.line([int(W * 0.15), court_accent_y, int(W * 0.85), court_accent_y], fill=(30, 41, 59, 180), width=6 * scale)

    # Owl Head Geometry (Stylized athletic geometric shape)
    owl_head = [
        (cx, int(H * 0.22)),              # Forehead top notch
        (int(cx + W * 0.18), int(H * 0.18)), # Right ear tuft tip
        (int(cx + W * 0.26), int(H * 0.35)), # Right cheek top
        (int(cx + W * 0.32), int(H * 0.55)), # Right cheek flare
        (int(cx + W * 0.22), int(H * 0.75)), # Right jaw
        (cx, int(H * 0.82)),              # Chin base
        (int(cx - W * 0.22), int(H * 0.75)), # Left jaw
        (int(cx - W * 0.32), int(H * 0.55)), # Left cheek flare
        (int(cx - W * 0.26), int(H * 0.35)), # Left cheek top
        (int(cx - W * 0.18), int(H * 0.18)), # Left ear tuft tip
    ]
    # Draw Owl Head Silhouette with dark obsidian shade
    draw.polygon(owl_head, fill=(15, 23, 42, 255))

    # Feather layer borders & glow
    draw.line(owl_head + [owl_head[0]], fill=(0, 240, 255, 120), width=3 * scale)

    # Aggressive Brow / Facial Shield
    brow_pts = [
        (cx, int(H * 0.44)),
        (int(cx + W * 0.24), int(H * 0.32)),
        (int(cx + W * 0.20), int(H * 0.38)),
        (cx, int(H * 0.52)),
        (int(cx - W * 0.20), int(H * 0.38)),
        (int(cx - W * 0.24), int(H * 0.32)),
    ]
    draw.polygon(brow_pts, fill=(30, 41, 59, 255))
    draw.line(brow_pts + [brow_pts[0]], fill=(204, 255, 0, 160), width=2 * scale)

    # Eyes Positions
    eye_offset_x = int(W * 0.155)
    eye_y = int(H * 0.47)
    eye_radius = int(W * 0.125)

    for side in (-1, 1):
        ex = cx + side * eye_offset_x

        # Outer socket ring (glow ring)
        glow_r = eye_radius + int(12 * scale)
        draw.ellipse([ex - glow_r, eye_y - glow_r, ex + glow_r, eye_y + glow_r], fill=(0, 240, 255, 40))
        draw.ellipse([ex - eye_radius - int(4*scale), eye_y - eye_radius - int(4*scale),
                      ex + eye_radius + int(4*scale), eye_y + eye_radius + int(4*scale)],
                     outline=(204, 255, 0, 240), width=3 * scale)

        # Tennis Ball Eye Body (Optic Tennis Volt Gradient)
        ball_img = Image.new("RGBA", (eye_radius * 2, eye_radius * 2), (0, 0, 0, 0))
        bdraw = ImageDraw.Draw(ball_img)

        # Tennis ball base color
        bdraw.ellipse([0, 0, eye_radius * 2, eye_radius * 2], fill=(204, 255, 0, 255))

        # Tennis ball shading (spherical gradient)
        for i in range(eye_radius):
            sh_alpha = int(70 * (1 - i / eye_radius))
            bdraw.ellipse([i, i, eye_radius * 2 - i, eye_radius * 2 - i], outline=(235, 255, 80, sh_alpha), width=2)

        # Authentic Tennis Ball Curved Seams (The signature white curved line)
        seam_color = (255, 255, 255, 245)
        seam_width = int(4.5 * scale)

        # Arc 1
        bdraw.arc([-int(eye_radius * 0.4), int(eye_radius * 0.1), int(eye_radius * 1.5), int(eye_radius * 1.9)],
                  start=30, end=150, fill=seam_color, width=seam_width)
        # Arc 2
        bdraw.arc([int(eye_radius * 0.5), int(eye_radius * 0.1), int(eye_radius * 2.4), int(eye_radius * 1.9)],
                  start=210, end=330, fill=seam_color, width=seam_width)

        # Athletic Owl Pupil in center of tennis ball
        pupil_r = int(eye_radius * 0.38)
        bdraw.ellipse([eye_radius - pupil_r, eye_radius - pupil_r, eye_radius + pupil_r, eye_radius + pupil_r],
                      fill=(7, 10, 17, 255))

        # Iris inner cyber ring
        inner_ring_r = int(pupil_r * 0.7)
        bdraw.ellipse([eye_radius - inner_ring_r, eye_radius - inner_ring_r, eye_radius + inner_ring_r, eye_radius + inner_ring_r],
                      outline=(0, 240, 255, 200), width=int(2 * scale))

        # Specular Highlight (Glossy reflection)
        glint_r = int(pupil_r * 0.35)
        glint_x = eye_radius - int(pupil_r * 0.35)
        glint_y = eye_radius - int(pupil_r * 0.35)
        bdraw.ellipse([glint_x - glint_r, glint_y - glint_r, glint_x + glint_r, glint_y + glint_r],
                      fill=(255, 255, 255, 230))

        # Paste Tennis Ball Eye
        img.paste(ball_img, (ex - eye_radius, eye_y - eye_radius), ball_img)

    # Owl Beak (Geometric diamond in tennis gold/volt)
    beak_top_y = int(H * 0.52)
    beak_pts = [
        (cx, beak_top_y),
        (cx + int(W * 0.045), beak_top_y + int(H * 0.08)),
        (cx, beak_top_y + int(H * 0.15)),
        (cx - int(W * 0.045), beak_top_y + int(H * 0.08)),
    ]
    draw.polygon(beak_pts, fill=(255, 204, 0, 255))
    draw.line(beak_pts + [beak_pts[0]], fill=(255, 240, 150, 255), width=int(2 * scale))
    # Beak center split
    draw.line([(cx, beak_top_y), (cx, beak_top_y + int(H * 0.15))], fill=(180, 130, 0, 200), width=int(2 * scale))

    # Downsample with Lanczos high quality filter for super smooth anti-aliased icon
    final_img = img.resize((size, size), Image.Resampling.LANCZOS)
    return final_img

def main():
    os.makedirs("assets", exist_ok=True)

    # 1. Main App Icon (1024x1024)
    print("Generating icon.png (1024x1024)...")
    icon = create_owl_tennis_icon(1024, transparent_bg=False)
    icon.save("assets/icon.png", "PNG")

    # 2. Splash Icon (1024x1024)
    print("Generating splash-icon.png (1024x1024)...")
    splash = create_owl_tennis_icon(1024, transparent_bg=False)
    splash.save("assets/splash-icon.png", "PNG")

    # 3. Android Adaptive Foreground (512x512 transparent)
    print("Generating android-icon-foreground.png (512x512)...")
    fg = create_owl_tennis_icon(512, transparent_bg=True)
    fg.save("assets/android-icon-foreground.png", "PNG")

    # 4. Android Adaptive Background (512x512 solid gradient)
    print("Generating android-icon-background.png (512x512)...")
    bg = Image.new("RGBA", (512, 512), (7, 10, 17, 255))
    bg_draw = ImageDraw.Draw(bg)
    for r in range(256, 0, -4):
        alpha = int(40 * (1 - r / 256))
        bg_draw.ellipse([256 - r, 256 - r, 256 + r, 256 + r], fill=(0, 240, 255, alpha))
    bg.save("assets/android-icon-background.png", "PNG")

    # 5. Monochrome Icon (432x432)
    print("Generating android-icon-monochrome.png (432x432)...")
    mono = create_owl_tennis_icon(432, transparent_bg=True)
    mono_l = mono.convert("L")
    mono_l.save("assets/android-icon-monochrome.png", "PNG")

    # 6. Favicon (48x48)
    print("Generating favicon.png (48x48)...")
    fav = icon.resize((48, 48), Image.Resampling.LANCZOS)
    fav.save("assets/favicon.png", "PNG")

    # 7. Native Android Mipmaps
    res_dir = "android/app/src/main/res"
    if os.path.exists(res_dir):
        print("Exporting native Android mipmap assets...")
        densities = {
            "mipmap-mdpi": (48, 108),
            "mipmap-hdpi": (72, 162),
            "mipmap-xhdpi": (96, 216),
            "mipmap-xxhdpi": (144, 324),
            "mipmap-xxxhdpi": (192, 432),
        }
        for folder, (launch_size, fg_size) in densities.items():
            target_dir = os.path.join(res_dir, folder)
            os.makedirs(target_dir, exist_ok=True)
            # Full launcher icon
            l_img = icon.resize((launch_size, launch_size), Image.Resampling.LANCZOS)
            l_img.save(os.path.join(target_dir, "ic_launcher.webp"), "WEBP")
            l_img.save(os.path.join(target_dir, "ic_launcher_round.webp"), "WEBP")

            # Adaptive Foreground
            fg_img = fg.resize((fg_size, fg_size), Image.Resampling.LANCZOS)
            fg_img.save(os.path.join(target_dir, "ic_launcher_foreground.webp"), "WEBP")

            # Adaptive Background
            bg_img = bg.resize((fg_size, fg_size), Image.Resampling.LANCZOS)
            bg_img.save(os.path.join(target_dir, "ic_launcher_background.webp"), "WEBP")

            # Monochrome
            m_img = mono_l.resize((fg_size, fg_size), Image.Resampling.LANCZOS)
            m_img.save(os.path.join(target_dir, "ic_launcher_monochrome.webp"), "WEBP")
        print("Native Android mipmaps updated successfully!")

    print("All app icon assets generated successfully!")

if __name__ == "__main__":
    main()

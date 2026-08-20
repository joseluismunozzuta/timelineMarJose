# Genera las entradas de LEGACY_IMAGE_URLS (lib/constants.ts).
#
# Recorre solo las carpetas numeradas de public/assets/img, que son las fotos de
# los momentos de fase 1 (la carpeta N corresponde al momento con visualIndex N+1).
# Ignora avatars/, back*.jpg y hero*.jpg, que no van en esa lista.
#
#   python scripts/list-legacy-images.py
#
# Ejecutar desde la raíz del proyecto.

import os

IMG_ROOT = os.path.join("public", "assets", "img")
EXTENSIONS = (".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp")


def numbered_folders(root):
    """Carpetas cuyo nombre es un número, ordenadas por su valor."""
    folders = [name for name in os.listdir(root) if name.isdigit()]
    return sorted(folders, key=int)


def image_urls(root):
    urls = []
    for folder in numbered_folders(root):
        for file in sorted(os.listdir(os.path.join(root, folder))):
            if file.lower().endswith(EXTENSIONS):
                urls.append(f"/assets/img/{folder}/{file}")
    return urls


if __name__ == "__main__":
    if not os.path.isdir(IMG_ROOT):
        raise SystemExit(f"No encuentro {IMG_ROOT}. Ejecuta el script desde la raíz del proyecto.")

    for url in image_urls(IMG_ROOT):
        print(f'    "{url}",')

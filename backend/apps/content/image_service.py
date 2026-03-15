"""
Utilities for calling the SDXL image generation service and saving
the resulting PNGs to the frontend public directory.
"""
import io
import zipfile
from pathlib import Path
from urllib.parse import quote

import requests
from django.conf import settings


def generate_and_save_images(category_id: str, scenario_id: str, prompts: dict) -> dict:
    """
    Call the SDXL image service for each prompt, unzip the response,
    and save the PNG to ``{FRONTEND_PUBLIC_DIR}/{category_id}/``.

    Args:
        category_id: e.g. "home-alone"
        scenario_id: e.g. "home-alone-a1b2c3d4"
        prompts: dict with keys "question", "success", "failure"

    Returns:
        dict with the same keys mapped to public paths,
        e.g. {"question": "/home-alone/home-alone-a1b2c3d4_question.png", ...}
        Keys with an empty prompt are skipped (path = "").
    """
    save_dir = Path(settings.FRONTEND_PUBLIC_DIR) / category_id
    save_dir.mkdir(parents=True, exist_ok=True)

    paths: dict[str, str] = {}

    for key, prompt in prompts.items():
        if not prompt:
            paths[key] = ''
            continue

        url = f"{settings.IMAGE_SERVICE_URL}/generate-image?prompt={quote(prompt)}"
        response = requests.get(url, timeout=120)
        response.raise_for_status()

        with zipfile.ZipFile(io.BytesIO(response.content)) as zf:
            png_name = next(n for n in zf.namelist() if n.endswith('.png'))
            filename = f"{scenario_id}_{key}.png"
            dest = save_dir / filename
            with zf.open(png_name) as src, open(dest, 'wb') as dst:
                dst.write(src.read())

        paths[key] = f"/{category_id}/{filename}"

    return paths

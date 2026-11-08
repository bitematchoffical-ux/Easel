"""Create a local handoff package without contacting a social platform.

Postloop (EU-Fork): Ziele sind Instagram, TikTok, YouTube Shorts und X. Das Paket
enthält Texte, Medien und eine Anleitung zum Selbst-Posten. Jeder Export verlangt eine
ausdrückliche Angabe, ob KI-generierte Bilder, Videos, Stimmen oder Personen enthalten
sind; dann liegen die Kennzeichnungsschritte der Plattform und ein fertiger Hinweistext bei
(Plattformregeln für KI-Inhalte, Transparenzpflichten nach EU AI Act Art. 50).
"""
from __future__ import annotations

import json
import uuid
import zipfile
from collections.abc import Mapping
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp", ".avif"}
VIDEO_EXTENSIONS = {".mp4", ".mov", ".webm", ".mkv", ".avi", ".m4v", ".flv", ".ts"}
MEDIA_EXTENSIONS = IMAGE_EXTENSIONS | VIDEO_EXTENSIONS

AI_CAPTION_LABEL = "Mit KI erstellt"


@dataclass(frozen=True)
class ManualTarget:
    label: str
    url: str
    title_limit: int          # 0 = kein eigenes Titelfeld
    body_limit: int           # Zeichen für Caption/Beschreibung
    video_only: bool
    steps: tuple[str, ...]    # Posten im offiziellen Upload-Fenster
    ai_label_steps: str       # wo die Plattform die KI-Kennzeichnung erwartet


PLATFORMS: dict[str, ManualTarget] = {
    "instagram": ManualTarget(
        label="Instagram", url="https://www.instagram.com/", title_limit=0, body_limit=2200,
        video_only=False,
        steps=("Auf instagram.com oder in der App „Erstellen“ wählen.",
               "Medien aus dem Ordner media/ in der Reihenfolge der Nummern hochladen "
               "(mehrere Bilder = Karussell, Video = Reel).",
               "Inhalt von caption.txt einfügen, Hashtags aus tags.txt sparsam ergänzen."),
        ai_label_steps="Vor dem Teilen unter „Erweiterte Einstellungen“ die Option "
                       "„KI-Label hinzufügen“ einschalten."),
    "tiktok": ManualTarget(
        label="TikTok", url="https://www.tiktok.com/tiktokstudio/upload", title_limit=0, body_limit=4000,
        video_only=False,
        steps=("TikTok Studio öffnen (Link oben) oder in der App auf „+“ tippen.",
               "Video bzw. Fotos aus media/ hochladen.",
               "Inhalt von caption.txt in die Beschreibung einfügen, Hashtags aus tags.txt ergänzen."),
        ai_label_steps="Unter „Weitere Optionen“ den Schalter „KI-generierte Inhalte“ aktivieren."),
    "youtube-shorts": ManualTarget(
        label="YouTube Shorts", url="https://studio.youtube.com/", title_limit=100, body_limit=5000,
        video_only=True,
        steps=("YouTube Studio öffnen und „Erstellen → Videos hochladen“ wählen.",
               "Hochformat-Video aus media/ hochladen (Shorts: vertikal, kurz).",
               "Titel aus title.txt und Beschreibung aus caption.txt einfügen."),
        ai_label_steps="Im Schritt „Details“ bei „Veränderte oder synthetische Inhalte“ „Ja“ wählen."),
    "twitter-x": ManualTarget(
        label="X", url="https://x.com/compose/post", title_limit=0, body_limit=280,
        video_only=False,
        steps=("Den Link oben öffnen.",
               "Inhalt von caption.txt einfügen, höchstens ein Bild oder Video aus media/ anhängen."),
        ai_label_steps="X hat keinen eigenen Schalter: den Hinweistext in den Post übernehmen."),
}


def publishing_mode(settings: Mapping[str, str]) -> str:
    """Preserve automatic publishing by default; reject unknown configured modes."""
    mode = settings.get("EASEL_PUBLISH_MODE", "").strip().lower()
    return "automated" if mode in ("", "automated") else "manual"


def caption_text(target: ManualTarget, title: str, body: str) -> str:
    """Plattformen ohne Titelfeld bekommen Titel und Text zusammen als Caption."""
    title, body = title.strip(), body.strip()
    if target.title_limit or not title:
        return body
    return f"{title}\n\n{body}" if body else title


def check_limits(target: ManualTarget, title: str, caption: str) -> list[str]:
    warnings = []
    if target.title_limit and len(title.strip()) > target.title_limit:
        warnings.append(f"Titel hat {len(title.strip())} Zeichen, {target.label} erlaubt {target.title_limit}.")
    if len(caption) > target.body_limit:
        warnings.append(f"Text hat {len(caption)} Zeichen, {target.label} erlaubt {target.body_limit}.")
    return warnings


def _instructions(target: ManualTarget, ai_generated: bool, warnings: list[str]) -> str:
    lines = [f"{target.label} · Paket zum Selbst-Posten", "",
             f"Offizielle Seite: {target.url}", ""]
    lines += [f"{index}. {step}" for index, step in enumerate(target.steps, 1)]
    step = len(target.steps) + 1
    if ai_generated:
        lines += [f"{step}. KI-Kennzeichnung: {target.ai_label_steps}",
                  f"   Zusätzlich den Text aus ki-hinweis.txt („{AI_CAPTION_LABEL}“) in die Caption setzen."]
        step += 1
    lines += [f"{step}. Vorschau prüfen und selbst auf „Teilen“/„Posten“ klicken.",
              f"{step + 1}. Den Link zum fertigen Post in Postloop eintragen, damit die Auswertung ihn kennt."]
    if warnings:
        lines += ["", "Achtung:"] + [f"- {warning}" for warning in warnings]
    lines += ["", "Dieses Paket wurde nicht hochgeladen oder veröffentlicht und enthält keine Zugangsdaten."]
    return "\n".join(lines) + "\n"


def build_package(outputs: Path, platform: str, title: str, body: str,
                  tags: str, media: list[str], reviewed: bool,
                  ai_generated: bool | None = None) -> Path:
    target = PLATFORMS.get(platform)
    if target is None:
        raise ValueError("Unbekannte Plattform")
    if reviewed is not True:
        raise ValueError("Bitte prüfe den Inhalt zuerst selbst und bestätige das.")
    if not isinstance(ai_generated, bool):
        raise ValueError("Bitte angeben, ob KI-generierte Bilder, Videos, Stimmen oder Personen enthalten sind.")
    if not title.strip() and not body.strip():
        raise ValueError("Titel oder Text darf nicht leer sein.")
    if len(media) > 32:
        raise ValueError("Höchstens 32 Mediendateien pro Export.")
    root = outputs.resolve()
    files: list[Path] = []
    for relative in dict.fromkeys(media):
        path = (root / relative).resolve()
        if root not in path.parents:
            raise ValueError("Medienpfad liegt außerhalb der Inhaltsbibliothek.")
        parts = path.relative_to(root).parts
        if any(part.startswith(("_", ".")) for part in parts):
            raise ValueError("Systemordner und versteckte Dateien können nicht exportiert werden.")
        if not path.is_file() or path.suffix.lower() not in MEDIA_EXTENSIONS:
            raise ValueError("Nur Bilder oder Videos aus der Inhaltsbibliothek können exportiert werden.")
        files.append(path)
    if target.video_only and not any(path.suffix.lower() in VIDEO_EXTENSIONS for path in files):
        raise ValueError(f"{target.label} braucht ein Video.")
    if sum(path.stat().st_size for path in files) > 2 * 1024**3:
        raise ValueError("Medien sind größer als 2 GB, bitte in mehreren Paketen exportieren.")

    caption = caption_text(target, title, body)
    warnings = check_limits(target, title, caption)
    media_names = [f"media/{index:02d}_{path.name}" for index, path in enumerate(files, 1)]
    metadata = {"platform": platform, "title": title, "tags": tags,
                "reviewed": True, "exportedAt": datetime.now(timezone.utc).isoformat(),
                "status": "ready_for_manual_submission", "officialUrl": target.url,
                "aiGenerated": ai_generated, "warnings": warnings, "media": media_names}
    if ai_generated:
        metadata["aiDisclosure"] = {"platformSetting": target.ai_label_steps,
                                    "captionLabel": AI_CAPTION_LABEL}
    texts = {"title.txt": title, "body.txt": body, "caption.txt": caption, "tags.txt": tags,
             "manifest.json": json.dumps(metadata, ensure_ascii=False, indent=2),
             "ANLEITUNG.txt": _instructions(target, ai_generated, warnings)}
    if ai_generated:
        texts["ki-hinweis.txt"] = AI_CAPTION_LABEL + "\n"

    destination = root / "_publish" / "manual"
    destination.mkdir(parents=True, exist_ok=True)
    package = destination / f"postloop-{platform}-{uuid.uuid4().hex[:12]}.zip"
    try:
        with zipfile.ZipFile(package, "w") as archive:
            for name, text in texts.items():
                archive.writestr(name, text, compress_type=zipfile.ZIP_DEFLATED)
            for name, path in zip(media_names, files):
                archive.write(path, name, compress_type=zipfile.ZIP_STORED)
        return package
    except Exception:
        package.unlink(missing_ok=True)
        raise

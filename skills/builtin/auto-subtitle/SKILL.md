---
name: auto-subtitle
description: "Automatische Untertitel: Sprache aus Audio oder Video als Untertiteldatei (SRT/ASS/TXT/JSON) erkennen und optional ins Video einbrennen. Verwenden, wenn der Nutzer Untertitel, Transkription, Captions im Video oder eingebrannte Untertitel will."
layer: produce
---

# Automatische Untertitel

Erkennt Sprache in Audio/Video und erzeugt Untertitel. Grundlage ist `skills/shared/scripts/asr.py` (faster-whisper),
mit festen, reproduzierbaren Parametern und sprachabhängigem Zeilenumbruch. Optional werden die Untertitel
eingebrannt (über `skills/shared/scripts/video_ops.py` bzw. den ffmpeg-Filter `subtitles`).

> Nur „Sprache → Untertiteldatei (+ optional einbrennen)“. Allgemeiner Schnitt: **video-editing**;
> Entrauschen: **audio-denoise**; lange Videos in Clips mit Untertiteln: **clipify**.

Für TikTok, Reels und Shorts sind eingebrannte Untertitel wichtig, weil viele ohne Ton schauen.

## Eingaben

| Feld | Pflicht | Bedeutung |
|------|------|------|
| input_file | ja | Audio- oder Videodatei (bei Video wird die Tonspur extrahiert) |
| format | nein | `srt` (Standard) / `ass` / `txt` / `json` |
| language | nein | `auto` (Standard) oder ISO-639-1 wie `de`/`en` |
| model | nein | `tiny`/`base` (Standard)/`small`/`medium`/`large-v3`; größer = genauer, langsamer |
| burn | nein | Untertitel ins Video einbrennen (nur mit Videoeingabe) |

Unterstützt: mp3/wav/m4a/aac/flac sowie mp4/mkv/mov/webm.

## Ausgabe

- Untertiteldatei in `outputs/<Thema>/` (SRT/ASS/TXT/JSON)
- Beim Einbrennen: Video mit festen Untertiteln (`*-sub.mp4`)
- Bericht: erkannte Sprache, Anzahl Untertitel, Modell, Pfade

## Voraussetzungen

- Beim ersten Lauf wird das Modell von HuggingFace geladen, **dafür braucht es Internet**. Das Skript nutzt
  `EASEL_PROXY` oder `http(s)_proxy`, sonst eine direkte Verbindung.
- Auf CPU reichen die Standardwerte `--device cpu --compute-type int8`.

## Ablauf

Skripte (relativ zum Projektverzeichnis): `skills/shared/scripts/asr.py`, `skills/shared/scripts/video_ops.py`.

### 1. Untertiteldatei erzeugen

```bash
# Video → SRT (Tonspur automatisch, Sprache Deutsch)
python skills/shared/scripts/asr.py transcribe \
  -i input.mp4 -o outputs/thema/input.srt --language de

# Video → ASS (mit Stil; Schriftgröße/Ränder passen sich Hoch-/Querformat an)
python skills/shared/scripts/asr.py transcribe \
  -i input.mp4 -o outputs/thema/input.ass --format ass --model small
# reines Audio → ASS: Größe unbekannt, Standard Hochformat 1080x1920; Querformat mit --res 1920x1080
python skills/shared/scripts/asr.py transcribe \
  -i voice.mp3 -o outputs/thema/voice.ass --format ass --res 1920x1080
```

- **ASS passt sich an Breite/Höhe an:** Schriftgröße nach der kurzen Seite (min(w,h)·0,05), unterer Rand nach Höhe,
  seitliche Ränder nach Breite, `PlayRes` = echte Auflösung. Bei Video automatisch, bei Audio per `--res`.
  **Für gestylte, eingebrannte Untertitel diese ASS-Datei nehmen** (siehe unten).
- **Zeilenlänge nach Sprache:** Deutsch und andere lateinische Sprachen 42 Zeichen pro Zeile, Umbruch nur an
  Wortgrenzen; Chinesisch/Japanisch/Koreanisch 18. Mit `--max-line-chars` änderbar (für Kurzvideos im Hochformat oft 32 besser).
- Ohne `-o` wird ein Projektordner nach dem Dateinamen angelegt (`talk.mp4` → `outputs/talk/talk.srt`); bei bestehenden
  Projekten `-o outputs/<Thema>/<Datei>.<format>` angeben.
- Modelle und Sprachen anzeigen: `python skills/shared/scripts/asr.py info`.

### 2. (optional) Untertitel einbrennen

Für „feste Untertitel im Video“ den ffmpeg-Filter `subtitles` (SRT) oder `ass` (ASS):

```bash
# SRT einbrennen (Stil anpassbar)
ffmpeg -y -i input.mp4 \
  -vf "subtitles=outputs/thema/input.srt:force_style='FontName=Inter,FontSize=20,PrimaryColour=&H00FFFFFF,OutlineColour=&H80000000,BorderStyle=1,Outline=2'" \
  -c:a copy outputs/thema/input-sub.mp4

# ASS einbrennen (Stil steckt in der Datei)
ffmpeg -y -i input.mp4 \
  -vf "ass=outputs/thema/input.ass" \
  -c:a copy outputs/thema/input-sub.mp4
```

- Pfade mit Sonderzeichen: Wert von `subtitles=` in einfache Anführungszeichen und Doppelpunkte escapen.
- Abschaltbare Untertitel statt eingebrannter: `ffmpeg -i in.mp4 -i sub.srt -c copy -c:s mov_text out.mp4`.
- Untertitel im Hochformat nicht in die unteren ~20 % setzen (dort liegen die Bedienelemente von TikTok/Reels/Shorts).

### 3. Ergebnis und Bericht

- Untertitel und Video in `outputs/<Thema>/`.
- Dem Nutzer melden: Sprache, Anzahl, Modell, Pfade; Hinweis, dass `--model`/`--max-line-chars` angepasst werden kann.

## Regeln

1. **Erst Tonspur extrahieren:** Das Skript erzeugt per ffmpeg 16-kHz-Mono-wav, das Originalvideo bleibt unverändert.
2. **Sinnvoll umbrechen:** an Satzzeichen und Wortgrenzen, keine überlangen Zeilen.
3. **Nie Originale löschen:** nur neue Dateien in `outputs/`.
4. **Modellwahl:** schnell `base`, genau `small`/`medium`; auf CPU int8.
5. **Einbrennen nur mit Video:** Bei Audio nur die Untertiteldatei.
6. **Kein Profil nötig.**

## Grundlagen

- [SYSTRAN/faster-whisper](https://github.com/SYSTRAN/faster-whisper): Whisper-Inferenz mit CTranslate2
- [openai/whisper](https://github.com/openai/whisper): ursprüngliches Whisper-Modell
- FFmpeg-Filter `subtitles` / `ass`

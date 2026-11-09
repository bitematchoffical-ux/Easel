---
name: tts-voiceover
description: "Text zu Sprache: Texte und Skripte als KI-Sprecherstimme, Erzählung oder Vorlesen vertonen, mit SRT-Untertiteln und mp3/wav/m4a. Mit VOICE_PROVIDER natürliche Cloud-Stimmen, sonst edge als Notlösung. Verwenden, wenn der Nutzer eine Vertonung, ein Voiceover, TTS oder eine KI-Stimme will."
layer: produce
---

# Text zu Sprache (Voiceover)

> **Konfiguration richtig prüfen:** zuerst per `cd` ins Projektverzeichnis aus den Laufzeit-Angaben, prüfen, dass `.env`
> und `skills/shared/scripts/` existieren. Cloud-TTS nur über
> `skills/shared/scripts/model_registry.py configured --group voice --env-file .env` und
> `skills/shared/scripts/voice_clone.py check ... --env-file .env` beurteilen; keine Skriptkopien im Workspace ausführen
> und nicht aus `env`/`printenv` auf fehlende Schlüssel schließen.

Vertont Texte und Skripte (Voiceover, Erzählung, Vorlesen). Gemeinsames Skript `skills/shared/scripts/tts.py speak`:
**Cloud zuerst.** Ist in `.env` `VOICE_PROVIDER` (+ `VOICE_API_KEY`) gesetzt, wird die Cloud-Stimme genutzt
(`voice_clone`, satzweise synthetisiert, zusammengefügt, mit SRT; natürlich und emotional). **Nur ohne Schlüssel greift
edge** als Notlösung (klingt mechanischer). `--engine closed/edge` erzwingt eine Variante; Cloud-Stimmen per `--voice`
mit Voice-ID; Standard-Erzähler über `VOICE_NARRATOR_VOICE_ID` änderbar. Danach mit `audio_ops.py`/`video_ops.py`
mischen oder ins Video legen.

**Rechtliches:** KI-Stimmen in Posts als KI-Inhalt kennzeichnen (beim Export „Ja“ bei der KI-Frage).
Stimmen echter Personen nur mit deren ausdrücklicher Zustimmung klonen. `edge` nutzt einen inoffiziell
angesprochenen Microsoft-Dienst (Paket `edge-tts`); für kommerzielle Nutzung einen offiziellen Anbieter einrichten.

## Eingaben

| Feld | Pflicht | Bedeutung |
|------|------|------|
| text / file | ja | Text oder Pfad zur Textdatei (lange Texte besser per `--file`) |
| voice | nein | Stimme, Standard `de-DE-KatjaNeural` |
| rate/volume/pitch | nein | Tempo / Lautstärke / Tonhöhe |
| output | nein | Standard `outputs/<Thema>/{name}.mp3` |

## Ausgabe

- Audiodatei (mp3, optional wav/m4a) in `outputs/<Thema>/`
- Optional SRT-Untertitel (`--subtitle`) fürs Video
- Ausgegeben werden der ausgeführte Befehl sowie Dauer, Größe und Stimme

## Voraussetzung: Internet

edge-tts ruft einen Onlinedienst auf und braucht Internetzugang. Hinter einem Proxy vorher setzen:

```bash
export https_proxy=http://<proxy-host>:<port> http_proxy=http://<proxy-host>:<port>
```

Das Skript übernimmt Proxy-Variablen automatisch (oder `--proxy`).

## Ablauf

Skript (relativ zum Projektverzeichnis): `skills/shared/scripts/tts.py`. Jeder Unterbefehl hat `-h`.

### 0. Stimme wählen (optional)

```bash
python skills/shared/scripts/tts.py voices          # deutsche + chinesische Stimmen mit Kurzbeschreibung
python skills/shared/scripts/tts.py voices --all    # alle de-/en-/zh-Stimmen (braucht Internet)
```

### 1. Vertonen (speak)

```bash
# einfachster Fall: ein Satz → mp3
python skills/shared/scripts/tts.py speak --text "Willkommen zur neuen Folge" \
  -o outputs/thema/intro.mp3

# langer Text aus Datei + andere Stimme + 10 % schneller
python skills/shared/scripts/tts.py speak --file script.txt \
  -o outputs/thema/narration.mp3 --voice de-DE-ConradNeural --rate +10%

# gleichzeitig SRT-Untertitel erzeugen
python skills/shared/scripts/tts.py speak --file script.txt \
  -o outputs/thema/vo.mp3 --subtitle outputs/thema/vo.srt

# wav ausgeben (braucht ffmpeg, verlustfrei weiterverarbeiten)
python skills/shared/scripts/tts.py speak --text "…" \
  -o outputs/thema/vo.wav --format wav
```

Parameter: `--rate +10%` (Tempo), `--volume +20%` (Lautstärke), `--pitch +2Hz` (Tonhöhe).

### 2. Nachbearbeitung (optional, vorhandene Skripte nutzen)

```bash
# ① Stimme + Musik mischen (Stimme 1.0 / Musik 0.3)
python skills/shared/scripts/audio_mix.py mix --voice vo.mp3 --bgm bgm.mp3 \
  --voice-volume 1.0 --bgm-volume 0.3 -o vo_bgm.mp3

# ② Lautheit auf Social-Media-Standard (-14 LUFS)
python skills/shared/scripts/audio_ops.py normalize vo.mp3 -o vo_norm.mp3

# ③ Voiceover unter ein Video legen
python skills/shared/scripts/video_ops.py bgm -i clip.mp4 -o clip_vo.mp4 \
  --music vo.mp3 --voice-volume 0.4 --music-volume 1.0 --music-loop-off
```

## Deutsche Stimmen (edge)

| Stimme | Charakter |
|------|------|
| `de-DE-KatjaNeural` | weiblich, klar und freundlich, Allrounder (Standard) |
| `de-DE-ConradNeural` | männlich, ruhig, Erklärvideos/Erzähler |
| `de-DE-AmalaNeural` | weiblich, jung und lebendig, Social-Clips |
| `de-DE-KillianNeural` | männlich, jung, locker |
| `de-DE-SeraphinaMultilingualNeural` | weiblich, sehr natürlich, mehrsprachig |
| `de-DE-FlorianMultilingualNeural` | männlich, sehr natürlich, mehrsprachig |

Österreich: `de-AT-IngridNeural`, `de-AT-JonasNeural`; Schweiz: `de-CH-LeniNeural`, `de-CH-JanNeural`.

## Regeln

1. **Originalmaterial nie überschreiben**: nur neue Dateien in `outputs/<Thema>/`.
2. **Lange Texte per `--file`**: vermeidet Probleme mit Zeilenumbrüchen und Länge.
3. **Netz prüfen**: edge-tts braucht Internet; bei Netzfehlern meldet das Skript es klar.
4. **Nichts neu bauen**: Mischen, Normalisieren und Unterlegen über audio_ops.py / video_ops.py.
5. **Geht auch ohne Profil**: dann Standardstimme Katja.

## Profil-Bezug

Mit Profil: bevorzugte Stimme, Tempo und Ton übernehmen (z. B. Social-Clips lebendig mit Amala, Erklärvideos ruhig
mit Conrad). Ohne Profil: Katja, normales Tempo.

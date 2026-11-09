---
name: auto-short-video
description: "Vom Thema zum fertigen Kurzvideo: Skript → Bilder/KI-Video → Vertonung → Untertitel → Musik → Schnitt als eine Pipeline. Für Erklär- und Talking-Head-Videos mit Bildern und Ken-Burns-Bewegung. Verwenden, wenn der Nutzer automatisch ein Kurzvideo, Reel oder TikTok aus einem Thema erstellen will."
layer: produce
---

# Kurzvideo auf Knopfdruck (End-to-End)

> Aus einem Thema wird automatisch ein Kurzvideo. Dieser SKILL ist die **Ablaufsteuerung**: Er verbindet vorhandene
> Bausteine zu einer Pipeline: Skript (video-script) → Bild je Satz (ai-image-gen) oder Clip (ai-video-gen) →
> Vertonung (tts-voiceover) → Untertitel (auto-subtitle) → Musik (ai-music) → **Zusammenschnitt (scripts/assemble.py)**.
> Ideen aus Pixelle-Video und MoneyPrinterTurbo.
>
> **Geschichten mit Figuren, Dialogen, Wendungen oder mehreren Folgen** → `short-drama` (jede Szene als Bild-zu-Video,
> keine Standbilder). **Nur Skript** → `video-script`. **Nur ein einzelner Clip** → `ai-video-gen`.

## Eingaben

- Thema / Text (Pflicht)
- Optional: Ziellänge, Stil, Vertonung/Untertitel/Musik ja oder nein, KI-Bilder oder eigenes Material
- **Format muss bestätigt sein:** Ist nicht ausdrücklich Hochformat oder Querformat (bzw. 9:16/16:9/Auflösung)
  festgelegt, vor jeder Produktion oder kostenpflichtigen Anfrage nachfragen und auf Bestätigung warten. Nicht still
  aus Plattform, Profil oder Standard ableiten; ist es festgelegt, nicht erneut fragen. Für TikTok, Reels und Shorts
  ist 9:16 (1080×1920) üblich.

## Ausgabe

Fertiges Video in `outputs/<Thema>/final.mp4`; Szenenbilder, Vertonung, Untertitel und Storyboard in `outputs/<Thema>/assets/`.

## Ablauf (je nach Bedarf kürzen; ohne API-Schlüssel automatisch vereinfachen oder nachfragen)

1. **Skript und Szenen:** Mit [video-script](../video-script/SKILL.md) einen Sprechtext schreiben, in N Sätze teilen
   (ein Satz = eine Szene) und je Satz eine Bildbeschreibung.

2. **Bilder erzeugen** (ein Bild oder Clip pro Szene):
   - Mit Bild-API-Schlüssel → [ai-image-gen](../ai-image-gen/SKILL.md) Text-zu-Bild pro Satz (im bestätigten Format)
   - Mit Bewegung → [ai-video-gen](../ai-video-gen/SKILL.md) Text- oder Bild-zu-Video
   - Eigenes Material → mit [image-editing](../image-editing/SKILL.md) `pad` auf das Format bringen
   - Nichts davon → Grafikkarten im passenden Format (Hochformat: card-xiaohongshu/poster-hero, Querformat: card-quote), dann `pad`.

3. **Vertonung:** [tts-voiceover](../tts-voiceover/SKILL.md) erzeugt die Sprachspur (mit SRT). **Mit `VOICE_PROVIDER`
   werden natürliche Cloud-Stimmen genutzt**, ohne Schlüssel edge (mechanischer). Für deutsche edge-Stimmen Standard
   `de-DE-KatjaNeural`. Nur ohne Vertonung überspringen.

4. **Untertitel:** SRT aus TTS nutzen oder [auto-subtitle](../auto-subtitle/SKILL.md) über die Vertonung laufen lassen;
   alternativ erzeugt assemble sie aus den Captions der Szenen. Umbruch nur an Wortgrenzen; Schrift per `--sub-font`
   (für Deutsch eine Schrift mit Umlauten, z. B. Inter). Mit Fontconfig und Pillow wird die Breite echt gemessen.

5. **Musik:** [ai-music](../ai-music/SKILL.md) oder vom Nutzer gelieferte Musik (nur mit Nutzungsrechten). Optional.

6. **Zusammenschnitt:** Storyboard-JSON schreiben und den Schnitt starten:
   ```bash
   python skills/builtin/auto-short-video/scripts/assemble.py assemble \
     --storyboard outputs/thema/assets/storyboard.json \
     -o outputs/thema/final.mp4
   ```
   Aufbau (Bild oder Video pro Szene; narration/bgm/subtitle optional; ohne duration wird nach Vertonung verteilt):
   ```json
   {
     "size": "<bestätigte Größe, z. B. 1080x1920 oder 1920x1080>",
     "image_motion": "ken-burns",
     "shots": [
       {"image": "outputs/thema/assets/shot1.png", "duration": 3, "caption": "Erster Satz", "motion": "static"},
       {"video": "outputs/thema/assets/clip2.mp4", "caption": "Zweiter Satz"}
     ],
     "narration": "outputs/thema/assets/voice.mp3",
     "bgm": "outputs/thema/assets/bgm.mp3",
     "subtitle": "outputs/thema/assets/voice.srt"
   }
   ```
   `image_motion` legt die Standardbewegung für Bilder fest, `motion` pro Szene überschreibt: Fotos `ken-burns`,
   Folien/Diagramme/Oberflächen mit Text immer `static` (proportional skaliert + aufgefüllt, kein Zuschnitt, kein Schwenk).
   Der Schnitt erzeugt automatisch Standbild oder Ken Burns, füllt aufs Format auf, fügt zusammen, mischt Stimme und
   Musik (Musik automatisch leiser) und brennt Untertitel ein.

   Lange Abläufe beim ersten Schnitt mit `--resume` starten und nach Abbruch mit denselben Parametern erneut aufrufen:
   ```bash
   python skills/builtin/auto-short-video/scripts/assemble.py assemble --resume \
     --storyboard outputs/thema/assets/storyboard.json \
     -o outputs/thema/final.mp4
   ```
   Fertige Szenen werden wiederverwendet, wenn Parameter, Material und Ergebnis übereinstimmen; Änderungen an Material,
   Dauer, Format, Bewegung oder Renderer machen sie ungültig. Checkpoints liegen neben dem Video in
   `.final.mp4.checkpoints/`; Bilder/Videos werden nicht neu erzeugt, kostenpflichtige APIs nicht erneut gerufen.
   Zusammenfügen, Mischen und Untertitel laufen jedes Mal neu; bei Fehlern bleibt das vorige Video erhalten.
   Ohne `--resume` wird wie bisher ein temporärer Ordner genutzt. Beschädigte Checkpoint-Listen führen zu einem Fehler
   und werden nicht automatisch gelöscht; den Ordner nur von Hand löschen, wenn kein Prozess mehr läuft.

7. **Übergabe:** final.mp4 mit einem Satz zur Produktion (welche Bausteine genutzt, was vereinfacht wurde).
   Enthält das Video KI-Bilder, KI-Clips, KI-Stimmen oder KI-Personen: darauf hinweisen, dass es beim Export als
   KI-Inhalt gekennzeichnet werden muss.

## Grundsätze

- **Bausteine dürfen fehlen:** Ohne Bild-, Video- oder TTS-Schlüssel automatisch vereinfachen (Grafikkarten statt
  Bilder, ohne Vertonung) und dem Nutzer ehrlich sagen, was vereinfacht wurde.
- **Erst Plan, dann Kosten:** Bei mehreren kostenpflichtigen APIs (Bild/Video/Musik) vorher sagen, welche genutzt
  werden und mit welcher Dauer und welchen Kosten ungefähr zu rechnen ist; erst nach Bestätigung starten.
- **Zwischenergebnisse aufheben:** Szenenbilder, Vertonung, Untertitel und Storyboard in `outputs/<Thema>/assets/`,
  damit einzelne Teile ersetzt und neu geschnitten werden können.

## Profil-Bezug

- Mit Profil: Ton und Bildstil aus `style.md` für Skript und Bild-Prompts; `platforms.md` nur für Format- und
  Längenvorschläge (Format trotzdem bestätigen lassen); Tabus aus `preferences.md` beachten.
- Ohne Profil: erst Hoch-/Querformat klären, dann allgemeiner Erklärstil.

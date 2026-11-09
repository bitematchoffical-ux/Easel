---
name: video-script
description: >
  Schreibt Videoskripte von 7 Sekunden bis 30 Minuten: Kurzvideos mit bewerteten Hooks, Sekunden-Timing,
  Untertiteln und Cover; längere Videos mit Retention-Bausteinen und Kapiteln. Für TikTok, Reels, Shorts und
  YouTube. Verwenden, wenn der Nutzer ein Videoskript, Reel- oder TikTok-Skript will.
layer: produce
---

# Videoskript

> Wählt je nach Ziellänge den Kurz- oder Langvideo-Modus und schreibt ein auf Zuschauerbindung optimiertes Skript.
> Skript auf Deutsch, außer die Zielgruppe braucht eine andere Sprache. Serien und Videoplanung: `video-strategy`.

## Eingaben

| Feld | Pflicht | Bedeutung | Beispiel |
|------|------|------|------|
| Thema | ja | Videothema | „Warum Gruppen nie wissen, wo sie essen sollen“ |
| Ziellänge | ja | Sekunden oder Minuten | 30 Sekunden / 10 Minuten |
| Plattform | nein | TikTok / Instagram Reels / YouTube Shorts / YouTube (sonst aus Länge ableiten) | TikTok |
| Inhaltstyp | nein | Erklärung / Tutorial / Test / Empfehlung / Kommentar / Sketch | Sketch |
| Kernpunkte | ja | was rein muss | Problem, App-Demo, Ergebnis |
| Ton | nein | sachlich / locker / frech / Gesprächston (Standard: Gesprächston) | locker |

## Modus nach Länge

| Länge | Modus | Typische Plattform | Kennzahl |
|------|------|----------|----------|
| 7–15 s | Kurz · Express | TikTok / Reels / Shorts | Zuschauerbindung in den ersten 3 s |
| 15–60 s | Kurz · Standard | TikTok / Reels / Shorts | Durchsehrate, Teilen per DM, Speichern |
| 1–5 min | Mittel | TikTok / YouTube | Bindung nach 5 s, Interaktionsrate |
| 5–30 min | Lang | YouTube | Bindung nach 30 s, Wiedergabedauer |

**Sprechtempo:** Deutsch etwa 140 Wörter pro Minute (ruhig 120, schnell 160).

---

## Kurzvideo-Modus (≤ 60 s)

### Schritt 1: Hooks (3 Varianten)

Aus 5 Hook-Typen 3 wählen, je eine Variante:

| Typ | Wann | Beispiel |
|------|---------|------|
| Neugierlücke | Fun Facts, Überraschendes | „Das machst du jeden Tag, und es schadet dir“ |
| Musterbruch | gegen Erwartungen | „Vergiss alles, was du über XY gelernt hast“ |
| Identität | genaue Zielgruppe | „Wenn du in einer Gruppe nie entscheiden willst, schau bis zum Ende“ |
| Schmerzpunkt | echte Frustration | „Ihr diskutiert 20 Minuten und landet wieder beim selben Laden“ |
| Autorität | Daten, Studien | „Laut Studie dauert die Restaurantwahl in Gruppen …“ (nur mit echter Quelle) |

Jeden Hook in 4 Dimensionen bewerten (je 1–5, max. 20): Neugier, Musterbruch, Identität, Klarheit in 3 Sekunden.
Der beste wird Haupt-Hook.

### Schritt 2: Skript mit Sekunden

| Länge | Aufbau |
|------|------|
| 7–15 s | Hook (0–2 s) + Kernnutzen (2–10 s) + Abschluss (10–15 s) |
| 15–30 s | Hook (0–3 s) + Problem (3–8 s) + Lösung (8–20 s) + Abschluss/CTA (20–30 s) |
| 30–60 s | Hook (0–3 s) + Problem (3–8 s) + Lösung (8–40 s) + Erkenntnis + CTA (40–60 s) |

Format:
```
[0-3s] HOOK
Sprechtext: „…“
Text-Overlay: „…“
Bild: [Beschreibung]

[3-8s] PROBLEM
Sprechtext: „…“
Bild: [Beschreibung]
```

Jeder Satz höchstens ~10 Wörter, gesprochene Sprache, Regieanweisungen in Klammern (Pause/Betonung/Mimik).
Text-Overlays in der sicheren Zone halten (nicht in die unteren ~20 % und rechten ~15 %, dort liegen die App-Bedienelemente).

### Schritt 3: Caption und Cover

**Caption:** 1–3 Sätze bei TikTok/Reels, Hook-Variante als Einstieg (nicht der Video-Hook wörtlich); Ziel: DM-Shares > Speichern > Likes.
**Hashtags:** 3–5 präzise Nischen-Hashtags, keine Allerweltstags.
**Cover:** 2–4 Wörter große Schrift + Bildbeschreibung + Gesichtsausdruck.
**KI-Inhalte** (KI-Stimme, KI-Personen, KI-Bilder) markieren → beim Export „Ja“ bei der KI-Frage.

### Schritt 4: Qualitätsbewertung (max. 100)

| Dimension | Gewicht | Prüfpunkte |
|------|------|--------|
| Hook-Stärke | 25 | Neugierlücke, Musterbruch, Klarheit in 3 s |
| Inhalt | 25 | Informationsdichte, Struktur, klares Problem→Lösung |
| Caption + CTA | 20 | Hook-Variante, CTA zum Teilen/Speichern |
| Format | 15 | 9:16, sichere Zone, Länge passt, Cover |
| Algorithmus-Signale | 15 | Speichern/Teilen gefördert, Originalität |

Ab 80 übergeben, unter 60 überarbeiten und neu bewerten.

---

## Mittel- und Langvideo (> 60 s)

> Ausführliche Methoden (Rhythmusbrüche, Vorwärts-Hooks, Kapitel, Retentionskurve) in
> `references/retention-scripting-guide.md` (auf Chinesisch, sinngemäß anwenden).

### Schritt 1: Aufbau berechnen

- **Hook:** 0:00–0:30 (bei kurzen Videos 0:00–0:10)
- **Einstieg:** 0:30–2:00
- **Erster CTA:** bei ~25 %
- **Zurückholen:** bei ~60 %
- **Schluss:** letzte 60 Sekunden
- **Zielwörter** = Länge (Minuten) × 140

### Schritt 2: Hook in drei Teilen

| Teil | Zeit | Ziel |
|------|------|------|
| Fangen | 0–5 s | wichtigster Satz des Videos, kein Intro davor |
| Versprechen | 5–15 s | was man am Ende konkret hat |
| Spannung | 15–30 s | was man verpasst, wenn man abbricht |

### Schritt 3: Abschnitte

Jeder Abschnitt: Rhythmusbruch → Inhalt → Mini-Fazit → Vorwärts-Hook.
**Rhythmusbruch** alle 60–90 s (bei Kurzvideos alle 15–30 s): [Schnitt] [Grafik] [Sound] [Zahl].

### Schritt 4: CTA und Schluss

- Erster CTA (25 %): weich, im Gesprächston, 10–15 s
- Zurückholen (60 %): „Jetzt kommt der wichtigste Teil“
- Schluss-CTA: klarer Aufruf + Ausblick aufs nächste Video, **kein „Danke fürs Zuschauen“**

### Schritt 5: Retention-Risiken

Gesamtes Skript prüfen und mindestens 3 Gefahrenstellen mit ⚠️ und Gegenmaßnahme markieren.

## Ausgabe

Nach `outputs/<Thema>/` schreiben, mit:
- Metadaten (Thema, Länge, Plattform, Wortzahl)
- vollständigem Skript (Zeitcodes, Sprechtext, Overlays, Bildhinweise)
- Liste der Rhythmusbrüche (Zeit/Typ/Beschreibung)
- Retention-Risikokarte (lang) bzw. Qualitätsbewertung (kurz)
- Hinweisen für den Schnitt

## Qualitätsprüfung

- [ ] Wortzahl passt zur Länge (140 Wörter/Minute, ±10 %): **zählen, nicht schätzen.** Den reinen Sprechtext (ohne
  Zeitcodes und Bildhinweise) per stdin an
  `python3 skills/shared/scripts/wordcount.py check --metric words --target <Minuten × 140> --tolerance 0.1`
  geben. Exit-Code 0 = passt; sonst nennt das Skript, wie viele Wörter zu viel oder zu wenig sind. Anpassen und neu prüfen.
- [ ] Hook vollständig (kurz: 3 bewertete Varianten; lang: dreiteilig)
- [ ] Rhythmusbrüche oft genug
- [ ] CTA an der richtigen Stelle
- [ ] Durchgehend gesprochene Sprache, kurze Sätze, kein Schriftdeutsch
- [ ] Schluss mit Energie, ohne Floskeln
- [ ] KI-Inhalte markiert

## Profil-Bezug

- **Mit Profil:** Plattform aus `platform`, Wortwahl aus `audience`, Ton aus `tone`, gewohnte CTA-Formulierungen aus `cta_style`
- **Ohne Profil:** Plattform aus der Länge ableiten, Gesprächston

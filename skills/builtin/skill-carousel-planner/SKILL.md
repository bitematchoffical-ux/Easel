---
name: skill-carousel-planner
description: >-
  Plant Karussells für Instagram, TikTok-Foto-Posts und LinkedIn: Cover-Hook, Ablauf, Text und Bildidee pro Karte,
  CTA und Caption, mit Interaktionsbewertung. Verwenden, wenn der Nutzer ein Karussell, einen Swipe-Post oder
  „was kommt auf welche Karte?“ planen will. Rendern danach mit card-xiaohongshu.
layer: plan
---

# Karussell planen

> Plant die Kartenstruktur eines Karussells: Cover-Hook, Spannungsbogen, Text und Bildidee pro Karte, CTA, Caption und
> eine Bewertung des Interaktionspotenzials. Texte auf Deutsch, außer die Zielgruppe braucht eine andere Sprache.

**Nach dem Laden sofort mit der Planung beginnen, nicht erst zusammenfassen oder auf Bestätigung warten.**

**Referenzdateien** (auf Chinesisch, Inhalte sinngemäß übertragen):
- `references/format-specs.md`: Formate, Kartenzahl, Schriftgrößen
- `references/hook-library.md`: bewährte Cover-Hooks mit Interaktionsdaten
- `references/scoring-system.md`: Bewertungsdimensionen und Schwellen

## Eingabe

Thema und Ziel aus der Nachricht: Stichwort, Satz oder ausführliches Briefing.

## Ausgabe

Ein Planungsdokument mit Cover-Text, Karte-für-Karte-Aufbau, Caption, Bewertung und Produktionshinweisen.

Speichern unter `outputs/<Thema>/carousel-brief.md`.

## Ablauf

### Schritt 1: Kontext

1. Thema und Ziel herausziehen (erklären, Conversion, Expertise, Unterhaltung).
2. Zielgruppe bestimmen.
3. Referenzdateien laden.
4. In `references/hook-library.md` den Hook-Typ mit der besten Passung suchen.

### Schritt 2: Cover-Hook

Das Cover folgt denselben Regeln wie der Anfang eines Kurzvideos: Es muss das Weiterscrollen in 1 Sekunde stoppen.

#### Regeln

- Höchstens 6–8 Wörter auf dem Cover
- Neugierlücke oder emotionaler Auslöser
- Bewährte Formeln:
  - **Gegen die Erwartung:** „Hör auf, XY zu machen“
  - **Zahlenliste:** „5 Fehler, die XY ruinieren“
  - **Vorher/Nachher:** visuelle Spannung durch Vergleich
  - **Schmerzpunkt:** „Warum XY bei dir immer scheitert“ (als Aussage, ohne Fragezeichen)
  - **Große Behauptung:** „Das ändert, wie du XY machst“
  - **Zugehörigkeit:** „Für alle, die XY“ (viele Saves und Shares)
- Große, kräftige Schrift, auch als Vorschaubild lesbar
- Kein Logo auf dem Cover (schwächt die Neugier)

Gewählte Formel und Cover-Text notieren.

### Schritt 3: Kartenstruktur

Bogen **Hook → Hinführung → Auflösung → Aufruf**:

| Karte | Rolle | Regel |
|------|------|------|
| 1 | Hook / Cover | höchstens 6–8 Wörter, Neugierlücke (Schritt 2) |
| 2–3 | Problem / Hinführung | Schmerzpunkt aufbauen oder Frage stellen |
| 4–7 | Inhalt / Mehrwert | ein Punkt pro Karte, höchstens ~15 Wörter Text |
| 8–9 | Auflösung / Erkenntnis | Kernaussage oder Wandel liefern |
| letzte | Aufruf | speichern / teilen / folgen / App laden |

#### Regeln je Karte

- **Ein Punkt pro Karte.** Braucht es ein Komma, auf zwei Karten aufteilen.
- **Höchstens ~15 Wörter Text-Overlay.** Weniger ist besser.
- **Einheitliche Optik:** gleicher Hintergrundstil, gleiche Schriften und Farben.
- **Leserichtung:** oben nach unten, links nach rechts, nichts verstreut.
- **Wisch-Anreiz:** Jede Karte gibt einen Grund, weiterzuwischen.

Pro Karte:
1. Nummer
2. Text-Overlay (höchstens ~15 Wörter)
3. Bildbeschreibung
4. Wisch-Anreiz (warum weiterwischen?)

### Schritt 4: Abschluss-CTA

Die letzte Karte entscheidet über Saves und Shares:

| CTA-Typ | Wann | Beispiel |
|----------|----------|------|
| Speichern | Tipps, Anleitungen | „Speichern für später“ |
| Teilen | Nachvollziehbares, Nützliches | „Schick das deiner Freundesgruppe“ |
| Folgen | Serien | „Folgen für Teil 2“ |
| Kommentar | Meinungsthemen | „Welcher Typ bist du? Schreib's in die Kommentare“ |
| DM/Keyword | Leads | „Kommentiere ‚LISTE‘ und ich schick sie dir“ |
| Download | App/Produkt | „Link in Bio, kostenlos testen“ |

Der CTA muss konkret sein; ein vages „Schau auf mein Profil“ ist als Haupt-CTA verboten.

### Schritt 5: Caption

Ergänzt das Karussell, wiederholt es nicht:

- Erster Satz: eigener Hook, der auch ohne die Karten trägt (die ersten ~125 Zeichen sind ohne „mehr“ sichtbar)
- Hauptteil: einen Punkt aus dem Karussell vertiefen, persönliche Sicht
- Schluss: passt zum CTA der letzten Karte
- Hashtags: 3–5 präzise Nischen-Hashtags, keine Allerwelts-Tags (#love #instagood bringen nichts)
- Länge: Instagram 150–400 Wörter gut, TikTok-Foto-Post kürzer, LinkedIn bis ~1.300 Zeichen
- KI-generierte Bilder oder Personen im Karussell → beim Export „Ja“ bei der KI-Frage

### Schritt 6: Interaktionsbewertung

Nach `references/scoring-system.md`:

| Dimension | Gewicht | Punkte (1–10) |
|------|------|-------------|
| Hook-Stärke | 25 % | |
| Wisch-Rhythmus / Anreiz | 20 % | |
| Informationsdichte | 20 % | |
| CTA-Wirkung | 15 % | |
| Einheitliche Optik | 10 % | |
| Caption-Qualität | 10 % | |

**Mindestens 7,0 im gewichteten Schnitt.**

Darunter die schwächste Dimension verbessern und neu bewerten.

### Schritt 7: Speichern

In `outputs/<Thema>/carousel-brief.md`:

```
## Karussell-Plan

**Thema:** [Thema]
**Ziel:** [Ziel]
**Plattform / Format:** [z. B. Instagram, 4:5]
**Karten:** [Anzahl]
**Hook-Formel:** [Formel]
**Bewertung:** [X,X / 10]

### Karte für Karte

#### Karte 1 (Cover)
- Text: „[Cover-Text]“
- Bild: [Beschreibung]

#### Karte 2
- Text: „[Text]“
- Bild: [Beschreibung]
- Wisch-Anreiz: [warum weiterwischen]

...

### Caption
[vollständige Caption]

### Produktionshinweise
- [Design, benötigtes Material, Schrift/Farben, KI-Inhalt ja/nein]
```

Danach anbieten, die Karten mit `card-xiaohongshu` zu rendern.

## Profil-Bezug

### Mit Profil

- `platform`: Format je Plattform (Instagram 4:5 Standard, 3:4 oder 1:1 möglich; TikTok-Foto 9:16 oder 4:5; LinkedIn-Dokument 4:5 oder 1:1)
- `tone`/`voice`: Ton von Cover und Caption
- `audience`: Hook und Einstieg passend zur Zielgruppe
- `positioning`: Inhalt an der Positionierung ausrichten
- `visual_style` (falls vorhanden): in die Bildbeschreibungen übernehmen

### Ohne Profil

- Allgemeiner Modus, Standard Instagram 4:5
- Neutraler Ton
- Am Ende: „Mit einem Konto-Profil passe ich Plattform und Bildsprache genauer an.“

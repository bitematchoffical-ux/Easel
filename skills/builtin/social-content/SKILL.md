---
name: social-content
description: >-
  Organische Social-Media-Posts für Instagram, TikTok, YouTube Shorts, X und LinkedIn: Hook, Text,
  Hashtags und Interaktion, für Reichweite und Community. Standard, wenn die Plattform unklar ist oder mehrere
  bedient werden. Verwenden, wenn der Nutzer einen Post oder eine Caption will.
layer: produce
---

# Social-Media-Posts

> Allgemeiner Generator für Posts auf mehreren Plattformen (Instagram, TikTok, YouTube Shorts, X, LinkedIn):
> plattformgerechte Hooks, Texte, Hashtags und Interaktionsaufrufe. Texte auf Deutsch, außer die Zielgruppe
> braucht eine andere Sprache.

## Zuständigkeit

Dieser SKILL ist der **allgemeine Standard**: mehrere Plattformen auf einmal, schnelle Entwürfe, unklare Plattform.
Für Spezialfälle an die passenden SKILLs übergeben:

| Fall | An |
|------|------|
| Instagram-Karussell (Kartenplan + Karten + Caption) | `skill-carousel-planner` → `card-xiaohongshu` |
| Konkretes Videoskript (Hook-Bewertung, Sekunden-Timing, Retention) | `video-script` |
| Verkaufstexte (Anzeigen, Produkt-/Landingpage, App Store) | `copywriting` |
| Posts streng nach PAS/AIDA/BAB | `post-formatter` |

Der SKILL kann trotzdem alles allein; Weitergeben ist kein Zwang.

## Eingaben

Teilweise optional; Fehlendes aus dem Profil oder mit Standardwerten ergänzen.

| Feld | Bedeutung | Beispiel |
|------|------|------|
| Plattform | eine oder mehrere | Instagram, TikTok, YouTube Shorts, X, LinkedIn |
| Format | Caption, Reel-/TikTok-Skript, Karussell, Text-Post, Thread | Reel |
| Thema | Inhalt oder Material | Text oder URL |
| Ziel | Interaktion, Reichweite, Marke, Downloads, Community | Interaktion |
| Zielgruppe | wer folgt | Schüler und Studis 15–25 |
| Ton | sachlich, locker, frech, inspirierend, lehrreich | locker |
| Material | Bilder, Videos, Zahlen | keins |

## Plattform-Eckdaten (Stand 2026, im Zweifel in der App prüfen)

| Plattform | Text | Sichtbar ohne „mehr“ | Format | Hashtags |
|---|---|---|---|---|
| Instagram | Caption bis 2.200 Zeichen | ca. erste 125 Zeichen | Feed 4:5 (1080×1350), Reels/Stories 9:16 (1080×1920), Karussell bis 20 Bilder | wenige gezielte (3–5) |
| TikTok | Beschreibung bis 4.000 Zeichen | erste Zeile | Video 9:16 (1080×1920), Foto-Modus | 3–5 |
| YouTube Shorts | Titel bis 100, Beschreibung bis 5.000 | Titel | vertikal 9:16, bis 3 Minuten | 2–3 im Titel/Beschreibung |
| X | 280 Zeichen (ohne Premium) | alles | Bild 16:9 oder 1:1, Video | 1–2 |
| LinkedIn | bis 3.000 Zeichen | ca. erste 210 Zeichen | Text, Bild, Dokument-Karussell (PDF) | 3–5 |

Die Referenzdateien [platform-specs.md](references/platform-specs.md), [content-formats.md](references/content-formats.md)
und [hashtag-strategy.md](references/hashtag-strategy.md) sind auf Chinesisch und für chinesische Plattformen
geschrieben: Grundideen übernehmen, Plattformwerte aus der Tabelle oben verwenden.

## Ausgabe

Für jede Zielplattform:

### 1. Post-Text

```
[Hook-Zeile]

[Text]

[CTA / Interaktionsaufruf]

[Hashtags]

Zeichen: N / Limit der Plattform
KI-Inhalt: ja/nein (bei ja: KI-Label beim Export setzen)
```

### 2. Interaktionsstrategie

- gute Posting-Zeit (aus Profil/Insights, sonst Faustregel nennen und als Annahme markieren)
- Nachbereitung (Kommentare beantworten, Story teilen, anpinnen)
- Verzahnung über Plattformen

### 3. Bildidee

- Bild/Cover/Video in 1–2 Sätzen
- Kartenplan fürs Karussell (falls passend)
- Hook für Kurzvideo (falls passend)

### 4. Varianten

- 2–3 Varianten je Plattform für A/B-Tests oder spätere Tage.

## Ablauf

1. **Anforderungen sammeln:** Felder aus der Nachricht ziehen; Fehlendes aus dem Profil, sonst Standardwerte.
2. **Plattformregeln laden:** Tabelle oben.
3. **Hook schreiben:** Formeln aus `skills/shared/references/hook-title-formulas.md` sinngemäß oder `skill-hook-generator`. Der Hook entscheidet über 90 % der Wirkung.
4. **Format bauen:**
   - Instagram-Karussell → Titelkarte mit Hook + Kartenplan + Caption
   - Reel/TikTok/Short → Hook (0–2 s) + Inhalt + CTA, Text-Overlay mitdenken
   - X → eine starke Aussage, ggf. Thread
   - LinkedIn → Hook-Zeile, kurze Absätze, persönliche Erfahrung, Frage am Ende
   - Repurposing → aus einem Inhalt Material für mehrere Plattformen
5. **Hashtags:** wenige, präzise: 1–2 große, 2–3 Nischen-, ggf. 1 Marken-Hashtag. Keine Hashtag-Wände.
6. **Regeln prüfen:** **Zeichen per Skript zählen, nicht schätzen.** Text per stdin an
   `python3 skills/shared/scripts/wordcount.py count` geben und `total_chars` mit dem Limit vergleichen
   (`social_count` gilt für chinesische Texte). Bei Überschreitung kürzen (ggf. `text-condenser`) und neu zählen.
   Außerdem: Werbung als „Anzeige“/„Werbung“ kennzeichnen, keine irreführenden Aussagen, Links passend zur Plattform
   (Instagram: „Link in Bio“, TikTok: Link im Profil).
7. **KI-Ton und Qualität (Pflicht, nicht überspringen):**
   - **KI-Ton entfernen:** Floskeln wie „Tauche ein in“, „In der heutigen Zeit“, „Entdecke die Magie“, „Lass uns gemeinsam“,
     leere Dreierlisten, Emoji-Ketten ohne Funktion, übertriebene Adjektive streichen. Die chinesischen Prüflisten in
     `../text-polisher/references/` gelten sinngemäß. Selbstcheck: klingt das wie ein echter Mensch aus der Zielgruppe?
   - **Qualität:** Klarheit, Rhythmus, Echtheit, Informationsdichte, Ton-Passung je 1–10 bewerten, zusammen mindestens 35/50.
   - Erst wenn beides passt, weiter.
8. **Varianten:** 2–3 je Plattform.
9. **Ausgabe:** im Format oben, gespeichert in `outputs/<Thema>/`. Zum Posten auf den Export-Tab verweisen.

## Profil-Bezug

### Mit Profil

Aus `=== EASEL ACCOUNT PROFILE ===` übernehmen:

- **platform** → Zielplattformen und Regeln
- **audience** → Wortwahl und Tiefe
- **tone/style** → gewohnter Kontostil
- **hashtag_sets** → bevorzugte Hashtags
- **posting_schedule** → Posting-Zeiten

### Ohne Profil

- Nach Zielplattform fragen, allgemeine Best Practices nutzen
- Am Ende: „Mit einem Konto-Profil passe ich Plattform und Stil genauer an.“

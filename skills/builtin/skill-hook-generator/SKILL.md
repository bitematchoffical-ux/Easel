---
name: skill-hook-generator
description: >-
  Erzeugt zu jedem Thema 6 Hook-Varianten (Einstiege) nach bewährten Formeln, mit Zeichenprüfung, für Reels,
  TikToks, Shorts und Karussells. Verwenden, wenn der Nutzer Hooks, einen Einstieg, „die ersten 3 Sekunden“ oder
  einen packenden Anfang will. Ganze Texte: copywriting; Videoskripte: video-script.
layer: plan
---

# Hook-Varianten

> Erzeugt zu jedem Thema 6 bewährte Hook-Varianten, jede zweizeilig (Einstieg + Wendung), um in den ersten
> Sekunden Aufmerksamkeit zu gewinnen. Hooks in der Sprache des Zielpublikums (Standard: Deutsch).

## Eingabe

Das Thema aus der Nachricht des Nutzers: Stichwort, Phrase oder ein Satz.

## Ausgabe

6 Varianten, jede mit:

- **Zeile 1 (Einstieg):** ≤ 60 Zeichen, Aussagesatz, überraschend, konkret, mit Wucht
- **Zeile 2 (Wendung):** ≤ 60 Zeichen, widerspricht dem Einstieg, deutet ihn um oder kippt ihn

Format:

```
### 1. Zahl voran
> [Einstieg]
> [Wendung]

### 2. Gegen die Erwartung
> [Einstieg]
> [Wendung]

### 3. Persönliche Verwandlung
> [Einstieg]
> [Wendung]

### 4. Autorität leihen
> [Einstieg]
> [Wendung]

### 5. Geständnis
> [Einstieg]
> [Wendung]

### 6. Blick in die Zukunft
> [Einstieg]
> [Wendung]
```

Danach:

```
---
Such dir einen Hook aus, ich mache daraus einen ganzen Post. Antworte einfach mit der Nummer.
```

## Ablauf

1. **Thema übernehmen:** aus der Nachricht; wenn vorhanden, nicht nachfragen.
2. **6 Varianten erzeugen** nach den Formeln in [hook-formulas.md](references/hook-formulas.md) (auf Chinesisch, Formeln sinngemäß):
   - Zahl voran (Number-led)
   - Gegen die Erwartung (Contrarian)
   - Persönliche Verwandlung (Personal transformation)
   - Autorität leihen (Authority steal)
   - Geständnis (Admission)
   - Blick in die Zukunft (Future shock)
3. **Jede Zeile prüfen:**
   - **≤ 60 Zeichen:** nicht schätzen, sondern zählen. Jede Zeile per stdin an
     `python3 skills/shared/scripts/wordcount.py count` geben und das Feld `total_chars` lesen
     (`social_count` ist für chinesische Texte gedacht). Bei mehr als 60 kürzen und neu zählen.
   - Einstieg ohne Fragezeichen
   - Bevorzugt Ich-Perspektive (bei Trend-, Zukunfts- und Autoritätsformeln nicht nötig)
   - Zahlen als Ziffern
4. **Im Format oben ausgeben.**
5. **Nächsten Schritt anbieten:** einen Hook zum ganzen Post ausbauen.

## Profil-Bezug

- **Mit Profil:** Ton, Sprache und Plattformgewohnheiten aus dem Profil übernehmen, z. B. TikTok schneller und
  umgangssprachlicher, Instagram-Karussell als Titel der ersten Karte, YouTube Shorts mit suchbaren Begriffen.
- **Ohne Profil:** neutraler Ton, mit dem Hinweis „Mit einem Konto-Profil passe ich den Stil an die Plattform an“.

## Regeln

1. Jede Zeile streng ≤ 60 Zeichen, gezählt mit `../../shared/scripts/wordcount.py count` (`total_chars`); sonst kürzen
2. Keine Frage im Einstieg
3. Keine Gedankenstriche (—)
4. Keine Füllwörter (eigentlich, halt, also, quasi, irgendwie)
5. Zahlen immer als Ziffern
6. Keine Unsicherheit (vielleicht, eventuell, wahrscheinlich)
7. Bevorzugt Ich-Perspektive; Trend-, Zukunfts- und Autoritätsformeln dürfen ohne „ich“
8. Direkt loslegen, keine Einleitung oder Begrüßung
9. Keine irreführenden Versprechen (keine erfundenen Zahlen, keine Heil- oder Erfolgsversprechen)

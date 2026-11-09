---
name: card-xiaohongshu
description: "Rendert vorhandene Kartentexte als Instagram-Karussell (Standard 1080×1350, 4:5) im Stil aus card-design. Verwenden, wenn der Nutzer Karussell-Karten, Wissenskarten oder Swipe-Posts erstellen will. Planung: skill-carousel-planner; Zitatkarte quer: card-quote."
layer: produce
---

# Karussell-Karten (Instagram)

> Der Ordnername `card-xiaohongshu` stammt aus dem Original; der SKILL erstellt in Postloop **Instagram-Karussells**
> (auch nutzbar als TikTok-Foto-Post und LinkedIn-Dokument). Texte auf den Karten auf Deutsch, außer die Zielgruppe
> braucht eine andere Sprache.

Du bist Visual Designer für Social Media und machst aus dem gelieferten Inhalt eine Serie von HTML-Karten.

## Vor dem Start: Designsystem lesen (sonst entstehen billige KI-Karten)

**Vor der ersten Zeile HTML das Designsystem [card-design](../card-design/SKILL.md) lesen** und dessen fünf Schritte befolgen:
① **Stil vom Nutzer wählen lassen.** card-design hat 9 Stile: Schweizer Minimalismus, Magazin-Editorial,
chinesische Tusche, Cremig-sanft, Dopamin-Y2K (knallig, verspielt), Luxus Schwarz-Gold, Sticker-Journal,
Geek-Terminal, Botanisch-frisch. Ohne Wahl 3–4 passende vorschlagen oder nach Inhalt empfehlen; „chinesische Tusche“
nur auf ausdrücklichen Wunsch.
② Stil-Spezifikation festlegen (Schriften, Hex-Farben; nichts frei erfinden) ③ Schrifthierarchie (je größer, desto
dünner) ④ Gerüst anwenden ⑤ nach dem Rendern `card_audit.py` als harte Prüfung laufen lassen.

Ohne Designsystem „nach Gefühl“ entstehen Karten mit Tech-Verlauf in Dunkelblau, Emojis als Icons und großen leeren
Flächen, also PowerPoint-Optik. **Wie gut die Karten aussehen, hängt vor allem vom passenden Stil ab**; nicht alles in
denselben Stil pressen.

Die Referenzen von card-design sind auf Chinesisch; die Regeln gelten unverändert. Für deutsche Texte Schriften mit
vollständigen Umlauten wählen (z. B. Inter, Manrope, DM Sans, Fraunces, Instrument Serif über Google Fonts) statt
chinesischer Schriften.

## Format

- N zusammenhängende Karten, jede `width: 1080px; height: 1350px` (4:5, Standard für Instagram-Feed).
  Alternativ 1080×1440 (3:4), wenn der Nutzer das will; das ganze Set dann einheitlich.
- Untereinander per flex anordnen, damit Gesamt- und Einzel-Screenshots möglich sind.
- N nach Inhaltsmenge: kurz 3–6 Karten, länger mehr (Instagram erlaubt bis 20; meist sind 5–10 am besten).
- Eine Karte = ein Kerngedanke.
- Wichtige Inhalte nicht in die äußeren ~60 px setzen (Profilraster und App-Oberfläche schneiden an).

## Aufbau

Gerüste aus `card-design/references/card-recipes.md` (Cover, Liste, Ablauf, Vergleich, Matrix, Zahlen, Zitat, Abschluss). Typisch:
1. **Cover-Karte:** große Display-Headline (dünn) + Hook-Unterzeile + Kicker oben + Infozeile unten (bis unten füllen, keine Leere in der Mitte). Die Cover-Karte ist der Hook im Feed.
2. **Inhaltskarten:** pro Karte ein Gedanke, mit inhaltsreichen Gerüsten (Liste/Ablauf/Matrix) gefüllt, nicht ein Satz vor viel Leere.
3. **Abschlusskarte:** Zusammenfassung (kleine Liste) + Aufruf (speichern, teilen, App laden) + Wasserzeichen.

## Gestaltung (verbindlich, Details in card-design)

- **Farben:** ein festes Schema aus `card-design/references/palettes.md` und **durchgehend für das ganze Set**. Wissen/Alltag: warme Papiertöne (Ink/Kraft/Dune); Tech/Tools: Schweizer System (Klein-Blau); knallig-verspielte Marken: Dopamin-Y2K oder Markenfarben aus dem Profil. **Fließtext nie reines Schwarz.**
- **Verboten:** Blau-Lila-Tech-Verläufe, Verlaufstext, Glassmorphism, Emojis als Icons, alles zentriert, fette schwarze Riesenheadlines, leere Flächen durch `flex:1`. (siehe `anti-ai-slop.md`)
- **Füllen:** Inhalt deckt ≥ 75 % der Höhe ab; jede grundlose Leerfläche > 15 % ist ein Fehler. Bei wenig Inhalt erweitern, platzsparendes Gerüst wählen oder auf 1:1 wechseln. (siehe `layout-laws.md`)
- Icons als Linien-Icons (Lucide-Stil, stroke 1.5) oder reine Typografie, keine Emojis. Große Schrift, starker Kontrast, viel Zeilenabstand (am Handy lesbar, Fließtext ≥ 28 px).
- Kleines Wasserzeichen in einer Ecke (Kontoname / Datum).
- **KI-generierte Bilder oder Personen** auf Karten: in der Caption und beim Export als KI-Inhalt kennzeichnen.

## Profil-Bezug

- **Mit Profil:** Markenfarben und Stilvorlieben aus `style.md` (trotzdem die Qualitätsregeln von card-design einhalten, keine schwammigen „sanften Verläufe“), Kontoname als Wasserzeichen aus `identity.md`.
- **Ohne Profil:** Standard aus card-design: Wissen/Tech → Schweizer System + Klein-Blau oder Magazin + Indigo Porcelain; Alltag/Gefühl → warme Papiertöne; Wasserzeichen leer.

## Abgrenzung zu anderen Karten-SKILLs

Alle drei sind „HTML → Screenshot“, nur Format und Zweck unterscheiden sich:

- **card-xiaohongshu (dieser)** = Hochformat-Karussell 4:5 (oder 3:4), mehrere Karten zum Wischen. Auch das **Cover eines Karussells** kommt von hier.
- **card-quote** = 16:9-Querformat für eine starke Aussage oder Zahl (X, LinkedIn, YouTube-Community).
- **poster-hero** = 1080×1920 **eigenständiges Werbeplakat** / Story-Grafik mit großer Headline, Nutzen und QR-Code, für Launches und Aktionen.

(Vor allen dreien zuerst card-design lesen.)

## Ausgabe

Vollständiges HTML nach `outputs/` schreiben und mit dem gemeinsamen Skript rendern (nicht manuell screenshotten):

```bash
# mehrere Karten: jedes .card-Element einzeln → card_1.png card_2.png ...
python skills/shared/scripts/render_card.py \
  --html outputs/thema/assets/cards.html \
  --out-dir outputs/thema --all ".card" --prefix card \
  --width 1080 --height 1350

# Pflicht nach dem Rendern: Prüfung auf Leerflächen und Dichte, erst bei PASS übergeben
python skills/builtin/card-design/scripts/card_audit.py audit -f "outputs/thema/card_*.png"
```

- Alle Karten im HTML mit derselben Klasse (z. B. `.card`), damit `--all` sie gesammelt exportiert.
- Das Skript nutzt Playwright + Chromium mit begrenzten Timeouts für CDN/Schriften; beim ersten Mal ggf. `playwright install chromium`.
- **Karten mit FAIL in card_audit** → nach der „Unterfüllungs-Leiter“ in `card-design/references/layout-laws.md` Inhalt ergänzen oder Gerüst wechseln und neu rendern, bis alles PASS ist.
- Danach Caption mit `social-content` schreiben und im Export-Tab ein Instagram-Paket erzeugen.

---
name: copywriting
description: >
  Verkaufsstarke Marketingtexte: Nutzen herausarbeiten und Headlines, Fließtext und CTA für Werbeanzeigen,
  Aktionen, Produktseiten, Landingpages und App-Store-Texte schreiben. Verwenden, wenn der Nutzer Werbetexte,
  Anzeigen, Slogans oder Verkaufsargumente will. Organische Posts: social-content.
layer: produce
---

# Marketingtexte

> Schreibt und verbessert Texte mit klarem Conversion-Ziel: Werbeanzeigen (Meta, TikTok, Google), Nutzenargumente,
> Aktionen, Produkt- und Landingpages, App-Store-Beschreibungen. Bewährte Frameworks, europäischer Kontext,
> Texte auf Deutsch (oder in der Sprache der Zielgruppe).

## Zuständigkeit

| Fall | Wer | Warum |
|------|--------|--------|
| **Verkaufs-/Conversion-Texte** (Nutzen, Anzeigen, Aktionen, Produkt- und Landingpages, App Store) | **dieser SKILL** | Ziel ist Kauf, Download, Anmeldung: Nutzen, Belege, CTA |
| Komplette Karussell-Posts (Karten + Caption + Hashtags) | `skill-carousel-planner` + `card-xiaohongshu` | Gesamtpaket statt Einzeltext |
| Organische Social-Posts (plattformgerechte Formate, Hooks, Hashtags, Interaktion) | `social-content` | Reichweite und Community, kein harter Verkauf |
| Posts streng nach PAS/AIDA/BAB/STAR (200–250 Wörter, mobil formatiert) | `post-formatter` | ein festes Framework sauber umgesetzt |

Kurz: **verkaufen → copywriting, organisch wachsen → social-content, festes Framework → post-formatter.**
Kombinierbar (copywriting liefert Argumente → post-formatter baut den Post → social-content passt an Plattformen an).

## Eingaben

Fehlendes aktiv erfragen:

1. **Texttyp:** Anzeige / Nutzenargumente / Aktion / Produktseite / Landingpage / App-Store-Text
2. **Produkt/Leistung:** Was, Kernnutzen, Unterschied zur Konkurrenz, Ergebnis für den Nutzer
3. **Zielaktion:** App laden, registrieren, kaufen, Link klicken, DM schreiben, vorbeikommen
4. **Kanal:** Instagram/Facebook-Anzeige, TikTok-Anzeige, Google, App Store, Website (bestimmt Länge, Ton, CTA)
5. **Belege** (falls vorhanden): Nutzerzahlen, Bewertungen, Tests, Fallbeispiele, Auszeichnungen
6. **Zielgruppe:** Wer liest das, welche Bedenken hat sie?

## Ausgabe

Je nach Texttyp (Strukturen in `references/copy-frameworks.md`, auf Chinesisch), meist:

- **Headline/Hook** + 2–3 Alternativen
- **Fließtext** im gewählten Framework (Problem → Lösung → Nutzen → Vertrauen → CTA)
- **Nutzenliste** nach FAB (Feature → Vorteil → Nutzen), Punkt für Punkt
- **CTA** + 2–3 Alternativen
- **Begründung:** gewähltes Framework und Prinzipien

## Ablauf

1. **Kontext klären:** Texttyp, Nutzen, Zielaktion, Kanal, Zielgruppe, Belege; Fehlendes nachfragen.
2. **Ton festlegen:** nach Profil oder Vorgabe (Anzeige: direkt; Aktion: dringlich; Produktseite: kompetent; Social Ads: locker und echt).
3. **Nutzen herausarbeiten:** mit FAB Features in Nutzen übersetzen (Definitionen in `skills/shared/references/copy-frameworks.md`) und priorisieren.
4. **Framework und Struktur wählen:** AIDA / PAS / FAB / 4U / BAB aus `skills/shared/references/copy-frameworks.md`, Strukturvorlage je Texttyp aus `references/copy-frameworks.md`.
5. **Headlines/Hooks:** 2–3 Varianten nach `skills/shared/references/hook-title-formulas.md` (sinngemäß übertragen).
6. **Fließtext:** ein Argument pro Absatz; flüssige Übergänge (Ideen in `references/natural-transitions.md`).
7. **Stil schärfen und KI-Ton entfernen (Pflicht):** Nutzen statt Features, Vertrauen früh, Bilder und Vergleiche, CTA mit Grund. KI-typische Floskeln entfernen („In der heutigen schnelllebigen Welt“, „Tauche ein in“, „Entdecke die Magie“, Dreierlisten ohne Inhalt, übertriebene Adjektive). Die chinesischen Prüflisten in `../text-polisher/references/` gelten sinngemäß. Selbstprüfung: klingt der Text wie von einem Menschen aus der Zielgruppe? Wenn nicht, überarbeiten.
8. **CTA:** 2–3 Varianten passend zur Zielaktion.
9. **Längen prüfen (bei Limits Pflicht):** nicht schätzen, zählen:
   ```bash
   python3 skills/shared/scripts/wordcount.py count -f outputs/thema/copy.txt
   ```
   `total_chars` mit dem Limit des Kanals vergleichen (z. B. Meta-Anzeige: Primärtext ~125 Zeichen sichtbar,
   Headline ~40; App Store Untertitel 30). Bei Überschreitung mit `text-condenser` kürzen und neu zählen.
10. **Zusammenstellen:** Text + Begründung + Alternativen nach `outputs/` schreiben.

## Grundsätze

- **Klarheit vor Kreativität:** In 3 Sekunden muss klar sein, worum es geht.
- **Nutzen statt Features:** „In 30 Sekunden wisst ihr, wo ihr esst“ statt „schneller Algorithmus“.
- **Konkret sein:** Zahlen statt Adjektive, wo es echte Zahlen gibt.
- **Sprache der Nutzer:** Formulierungen aus Kommentaren, Bewertungen und DMs spiegeln, kein Marketing-Sprech.
- **Ein Argument pro Absatz:** Schritt für Schritt „Interesse → Vertrauen → Handlung“.
- **Vertrauen früh:** Bewertungen, Nutzerzahlen, Tests früh zeigen, aber nur echte.
- **CTA mit Grund:** nicht nur „Jetzt laden“, sondern warum jetzt (kostenlos, nur heute, für eure nächste Gruppe).
- **Rechtlich sauber (EU):** keine irreführenden Aussagen (UWG), Superlative nur mit Beleg, Preise inklusive MwSt.,
  Werbung als solche erkennbar, KI-generierte Personen/Bilder kennzeichnen, bei Minderjährigen als Zielgruppe
  keine direkten Kaufaufforderungen.

## Texttypen im Überblick

| Typ | Framework | Ton | Kern |
|------|----------|------|------|
| Social-Ad (Instagram/TikTok) | AIDA / 4U | locker, nativ | Hook in der ersten Zeile, wirkt wie ein normaler Post |
| Such-/Display-Anzeige | AIDA / 4U | direkt | Nutzen zuerst, klarer CTA |
| Nutzenargumente | FAB | knapp | Feature → Vorteil → Nutzen, priorisiert |
| Aktion | Dringlichkeit + Wertanker | rhythmisch | klares Angebot, echte Frist, wenig Hürde |
| Produktseite | FAB + Einwandbehandlung | kompetent | Nutzen in Ebenen, Einwände ausräumen |
| Landingpage | AIDA + Abschnitte | je Zielgruppe | Wertversprechen oben, Vertrauen, ein Haupt-CTA |
| App-Store-Text | FAB + Keywords | klar | Untertitel 30 Zeichen, erste 3 Zeilen entscheiden |

## Profil-Bezug

- **Mit Profil:** `style.md` (Ton), `audience.md` (Zielgruppe), `preferences.md` (Tabus) lesen; Ton, Wortwahl und Argumente daran ausrichten.
- **Ohne Profil:** nach Ton (locker/kompetent/dringlich), Zielgruppe und Markenpersönlichkeit fragen; sonst neutral-professionell und am Ende anmerken: „Mit einem Konto-Profil werden die Texte markengenauer.“

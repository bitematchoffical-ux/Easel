---
name: skill-content-calendar
description: >-
  Erstellt einen Monats-Redaktionsplan für Instagram, TikTok, YouTube Shorts und X: jeder Slot mit
  Thema, Aufhänger und Bildidee. Verwenden, wenn der Nutzer einen Content-Kalender, Redaktionsplan,
  Posting-Plan oder „was posten wir diesen Monat?“ will. Nutzt die Säulen aus skill-content-strategy.
layer: plan
---

# Content-Kalender

Du bist Social-Media-Planer und planst einen Monat Inhalte: Jedes Thema ist so konkret, dass ein Texter sofort
loslegen kann, und der Mix insgesamt ist strategisch genug, dass das Konto wächst. Antwort auf Deutsch.

Jeder Slot hat einen klaren Zweck. Vage Anweisungen wie „ein Tutorial posten“ sind verboten.

---

## Abgrenzung zu anderen Planungs-SKILLs

| SKILL | Aufgabe | Grenze |
|-------|------|------|
| content-strategy | Meta-Strategie: Säulen, Zielgruppenpfad, Rhythmus | kein Monatsplan |
| **content-calendar (dieser)** | macht aus der Strategie einen **konkreten Monatsplan** | **definiert keine Säulen neu**, übernimmt sie aus Strategie oder Profil |
| content-matrix | Themen- und Titelpool | Slots können daraus befüllt werden |
| content-calendar-log | gemeinsame Kalender-Zeitleiste (gepostet / geplant / Events) | vor dem Planen **zuerst** dessen `context` lesen; der fertige Plan kann dorthin zurückgeschrieben werden |

Basiswerte für Säulenanteile und Posting-Frequenz stehen in `../../shared/pillar-and-cadence.md`, Formatmix in
`references/content-mix-guide.md` (beide noch auf Chinesisch und teils für chinesische Plattformen; Werte sinngemäß
auf Instagram, TikTok, YouTube Shorts und X übertragen). Diese Tabellen hier nicht kopieren.

Vor dem Planen den Kalender lesen (bereits Gepostetes, Geplantes, anstehende Events, um Lücken und Kollisionen zu vermeiden):

```bash
python skills/shared/scripts/calendar_ops.py context --days 14
```

---

## Verfügbare Daten und Werkzeuge

Bei jedem Lauf zuerst sagen, welche Eingaben vorliegen und welche fehlen. Fehlendes wird im Plan als Annahme markiert.

### Was der Nutzer liefern sollte (kostenlos und wirkungsvoll zuerst)

| Eingabe | Woher | Wirkung |
|------|---------|--------|
| **Bisherige Top-Posts** | Insights der Plattform, nach Reichweite/Speichern sortiert, Top 10 | passt Säulengewichte direkt an |
| **Aktionen in den nächsten 4 Wochen** | nachfragen: Launch, Event, Kooperation, Feiertag? | Aktionen zuerst einplanen, Rest darum herum |
| **Plattform-Statistiken** | Insights der Plattformen | zeigt beste Formate und Uhrzeiten |
| **Vergleichskonten** | 2–3 Konten aus derselben Nische | Lücken und Abgrenzung finden |
| **Was beworben werden soll** | Produkt/Feature des Monats | damit nicht nur Mehrwert-Content ohne Ziel entsteht |

### Trends und Basismodus
- Für aktuelle Themen den Trend-Radar bzw. `skill-trending-topics` nutzen.
- Ohne externe Werkzeuge normal weiterarbeiten: Wettbewerbs- und Trendanalyse überspringen, als Annahme markieren und
  auf Basis von Profil und Best Practices planen.

---

## Phase 0: Start

Lesen, falls vorhanden:
- Nutzerprofil (Kontext `=== EASEL ACCOUNT PROFILE ===`)
- Säulen und Stil aus einem früheren Lauf von content-strategy

Vorhandenes und Fehlendes notieren. Ohne Profil im allgemeinen Modus arbeiten.

---

## Phase 1: Anforderungen

Folgendes klären (aus vorhandenem Kontext vorbefüllen):

1. **Monat und Plattformen:** Welcher Monat? Welche Plattformen (Instagram, TikTok, YouTube Shorts, X)? Bei mehreren: gemeinsamer Kern mit Anpassung oder getrennte Pläne?
2. **Frequenz:** Posts pro Woche und Plattform. Ohne Angabe die Basiswerte aus `../../shared/pillar-and-cadence.md` übertragen.
3. **Monatsziel** (eines im Fokus): Reichweite/Follower, Downloads/Anmeldungen, Interaktion/Community, Produkt/Aktion pushen, Expertise aufbauen.
4. **Anstehende Aktionen:** Launch, Events, Kooperationen, Feiertage, Schulferien in den nächsten 4 Wochen?
5. **Inhaltssäulen:** aus Profil oder content-strategy. Fehlen sie, 4–5 Säulen nach den Basiswerten vorschlagen und bestätigen lassen.
6. **Wettbewerb/Trends:** Soll eine Wettbewerbs- oder Trendanalyse laufen?

---

## Phase 2: Recherche (optional)

### Wettbewerbsanalyse
Je Konto: Themen und Formate der letzten 3–4 Wochen, 2–3 Posts mit hoher Interaktion, 2–3 Chancen zur Abgrenzung.

### Trends
Über den Trend-Radar: Trends der Nische, anstehende Feiertage/Events (z. B. Valentinstag, Ferienbeginn,
Black Friday), 3–5 konkrete Themen, die in den Plan passen.

Erst 6–10 Kernpunkte zusammenfassen, dann weiter.

---

## Phase 3: Content-Mix

### Schritt 1: Säulenanteile
Anteile nach Monatsziel, Kontotyp und bisherigen Daten verteilen. **Basiswerte und Anpassungsregeln stehen in
`../../shared/pillar-and-cadence.md`** (hier nicht kopieren).

Anpassen nach: Monatsziel (Aktionsmonat → mehr Promo, Wachstumsmonat → mehr Mehrwert), Top-Posts, Aktionen (zuerst setzen).

### Schritt 2: Formatmix
Über den Monat verschiedene Formate (Reel/TikTok-Video, Karussell, Story, Short, Text-Post). **Anteile und
Plattformvorlieben stehen in `references/content-mix-guide.md`.** Mix bestätigen, dann den Plan bauen.

---

## Phase 4: Plan bauen

Den ganzen Monat in 4 Wochen planen.

**Regeln:**
- Säulen gleichmäßig verteilen; Promo-Posts nicht in einer Woche ballen
- Aufwendige Formate (Video, Karussell) auf interaktionsstarke Tage legen
- Aktions-Posts zuerst fest einplanen, Rest drumherum
- Zwischen zwei Promo-Posts mindestens ein Nicht-Promo-Post
- Mehrere Plattformen bekommen unterschiedliche Versionen, kein Copy-Paste
- KI-generierte Bilder/Videos/Personen im Plan markieren (später KI-Label beim Export)

**Jeder Post:**
```
Post [n]
Woche: [1-4] | Tag: [Mo–So] | Plattform: [Instagram/TikTok/YouTube Shorts/X]
Säule: [Name] | Format: [Reel/Karussell/Story/Short/Text] | Ziel: [Reichweite/Interaktion/Conversion/Follower]
Thema: [konkret, z. B. „5 Gründe, warum eure Gruppe nie weiß, wo sie essen soll“ statt „Tipp-Post“]
Aufhänger: [warum bleibt man hier hängen?]
Bildidee: [1 Satz zu Bild/Video]
KI-Inhalt: [ja/nein]
Notiz: [Timing, Bezug zu Aktion usw.]
```

Alle Posts auf einmal erstellen und dann zeigen, nicht einzeln.

---

## Phase 5: Ausgabe

### 1. Übersicht
| # | Woche | Tag | Plattform | Säule | Format | Thema |
|---|----|----|------|------|------|------|
| 1 | W1 | Mo | Instagram | Mehrwert | Karussell | 5 Gründe, warum eure Gruppe nie weiß, wo sie essen soll |

### 2. Vollständiger Plan
Alle Posts mit allen Details.

### 3. Speichern
Als `outputs/content-kalender/content-kalender-JJJJ-MM.md` speichern (Pfad vorher mit `output_paths.py` prüfen).

### 4. Nächste Schritte
```
Content-Kalender gespeichert. Weiter mit:
- social-content: Texte für die geplanten Posts schreiben
- card-xiaohongshu: Karussell-Karten für Instagram erstellen
- Anzahl Posts gesamt / davon Videos / davon Karussells
```

---

## Phase 6: Anpassen

Nach der Übersicht Optionen anbieten: Thema tauschen, Tag verschieben, Aktions- oder Trend-Post ergänzen,
Säulenanteile ändern, Version für weitere Plattform erzeugen. Danach Datei neu speichern.

---

## Praxisregeln

- **Aktionen zuerst einplanen**: Sie bestimmen die Struktur des Monats.
- **Themen müssen konkret sein**: „Tutorial“ ist kein Briefing, „Checkliste für den ersten Post auf TikTok“ schon.
- **Promo höchstens 20 %**: Mehr Vertrauens-Content bringt mehr Conversion.
- **Werbung kennzeichnen**: Bezahlte Kooperationen als „Anzeige“/„Werbung“ markieren.

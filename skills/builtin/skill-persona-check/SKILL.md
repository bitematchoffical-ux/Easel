---
name: skill-persona-check
description: >-
  Prüft, ob ein Inhalt zum Konto-Profil passt (Positionierung, Themenfeld, Format, Zielgruppe, Stil,
  Tabus) und gibt Punktzahl und Abweichungen aus. Verwenden, wenn der Nutzer fragt „passt das zu mir?“,
  „klingt das nach uns?“ oder eine Marken- bzw. Stilprüfung will. Braucht ein Profil.
layer: publish
---

# Profil-Passung prüfen

> Prüft, ob ein Inhalt zu Persona und Markenton passt, und liefert Punktzahl und Abweichungsanalyse.
> Antwort an den Nutzer auf Deutsch.

## Abgrenzung

| SKILL | Rolle | Fokus |
|---|---|---|
| **persona-check** (dieser) | Persona-/Markenpassung | Positionierung, Thema, Format, Zielgruppe, Stil |
| skill-quality-gate | Regel- und Qualitätsprüfung | Plattformregeln, Inhaltsqualität |
| skill-publish-checklist | Vollständigkeit | Titel, Cover usw. vorhanden? |

## Voraussetzung

**Ohne Profil keine Prüfung.** Das Profil sollte (ganz oder teilweise) enthalten:

- `identity.md`: Positionierung, Hauptthema, Inhaltsrichtung
- `style.md`: Ton, Erzählweise, Bildsprache, Formate
- `audience.md`: Zielgruppe und ihre Bedürfnisse
- `preferences.md`: Machen, Nicht machen, klare Tabus
- `memory.md`: bestätigte Erfahrungen und Fehler dieses Profils

Ohne Profil sofort einen Hinweis zurückgeben und nicht prüfen.

## Eingaben

- **Zu prüfender Inhalt:** Text oder Pfad zum Ergebnis
- **Profil:** per Markierung `=== EASEL ACCOUNT PROFILE ===` eingefügt oder per Profilname

## Ausgabe

Strukturierter Bericht als JSON (Schlüssel bleiben englisch, Texte auf Deutsch):

```json
{
  "overall_score": 85,
  "verdict": "consistent | minor_drift | major_drift",
  "publish_allowed": true,
  "warning": "",
  "dimensions": [
    {
      "dimension": "Name der Dimension",
      "score": 90,
      "status": "aligned | drifted",
      "evidence": "konkreter Beleg",
      "suggestion": "Vorschlag"
    }
  ],
  "drift_summary": ["Abweichungen in Kürze"],
  "rewrite_hints": ["konkrete Änderungsvorschläge"],
  "summary": "Ein-Satz-Fazit"
}
```

Bewertung:
- 80–100: passend (consistent), keine Warnung
- 60–79: leichte Abweichung (minor_drift), klare Warnung mit Vorschlägen
- 0–59: deutliche Abweichung (major_drift), auffällige Warnung zu Positionierung, Thema oder Format

**Die Profilprüfung ist nur ein Hinweis, keine Freigabe.** `publish_allowed` ist immer `true`. Niedrige Werte
blockieren nie und zwingen nicht zum Umschreiben. Hat der Nutzer das Posten ausdrücklich verlangt, Warnung zeigen
und weitermachen. Inhaltssicherheit, Plattformregeln und sensible Daten sind eigene harte Prüfungen außerhalb dieses SKILLs.

## Ablauf

### Schritt 1: Profil lesen

1. Prüfen, ob Profil-Kontext vorhanden ist (Markierung `=== EASEL ACCOUNT PROFILE ===`).
2. **Kein Profil** → diesen Hinweis ausgeben und abbrechen:
   ```
   Kein Konto-Profil gefunden, daher keine Profilprüfung möglich.
   Bitte zuerst ein Profil anlegen: geführt mit skill-profile-builder oder profiles/_template/ kopieren und ausfüllen.
   style.md sollte Schreibstil, Grundton, Persönlichkeit und typische Formulierungen enthalten.
   ```
3. **Profil vorhanden** → `identity.md`, `style.md`, `audience.md`, `preferences.md`, `memory.md` lesen, beim
   Veröffentlichen zusätzlich `platforms.md`. Zuerst Hauptthema, erlaubte Themen, Formate und Zielgruppe
   herausziehen, dann Ton, Wortwahl und Plattformgewohnheiten. Nicht nur `style.md` lesen und nach Sprachähnlichkeit bewerten.

### Schritt 2: Inhalt analysieren

1. **Thema und Absicht:** Worum geht es, gehört es zum Kernthema oder ist es eine sinnvolle Erweiterung?
2. **Format:** Karussell, Reel, Talking Head, Review, Animation usw. passend zur Positionierung?
3. **Zielgruppe:** Nutzen, Emotion und Einstiegshürde passend zur Profil-Zielgruppe?
4. **Sprache:** Ton, Wortwahl, Satzbau, Perspektive, Emotion
5. **Plattform und Vorlieben:** passend zur Zielplattform, kein Verstoß gegen „Nicht machen“?

### Schritt 3: Dimension für Dimension vergleichen

| Dimension | Vergleich | Gewicht |
|---|---|---|
| **Positionierung und Themenfeld** | Thema vs. Hauptlinie, Inhaltsrichtung, Themenpool in `identity.md` | 30 % |
| **Format** | Karussell/Reel/Talking Head usw. vs. Hauptformate des Profils | 15 % |
| **Zielgruppe** | Nutzen und Publikum vs. `audience.md` | 15 % |
| **Ton und Erzählweise** | Ton, Tempo, Perspektive vs. `style.md` | 15 % |
| **Persönlichkeit und Wortwahl** | Ausdruck, Vokabular, Markenformulierungen | 10 % |
| **Plattform** | Form und Ausdruck vs. `platforms.md` (ohne Zielplattform neutral bewerten) | 10 % |
| **Vorlieben und Erfahrungen** | `preferences.md` und `memory.md` | 5 % |

Jede Dimension 0–100, daraus gewichtete Gesamtpunktzahl.

Damit sprachliche Ähnlichkeit keine grundsätzliche Fehlpassung überdeckt, gelten Obergrenzen:

- **Positionierung und Themenfeld < 40:** Gesamt höchstens 59, zwingend `major_drift`.
- **Format < 40:** Gesamt höchstens 69, mindestens `minor_drift`.
- Verstoß gegen bestätigte „Nicht machen“-Punkte oder Tabus: Gesamt höchstens 39, Beleg nennen; trotzdem nur warnen.
- Will der Nutzer bewusst ein anderes Themenfeld, erhöht das die Punktzahl nicht; im Bericht „bewusster Themenwechsel“ vermerken.

Beispiel: Ein Food-App-Konto mit witzigen Reels postet einen ernsten Langtext über Finanzen. Auch bei lockerem Ton
passen Thema und Format nicht: Gesamt unter 60, kein 80+ wegen guter Formulierungen.

### Schritt 4: Abweichungen belegen

Für jede Dimension unter 80:

1. **Zitat:** konkreten Satz oder Abschnitt nennen
2. **Vergleich:** Erwartung laut Profil vs. tatsächliche Umsetzung
3. **Schwere:** beeinflusst es die Wahrnehmung der Persona insgesamt?

### Schritt 5: Vorschläge

Für jede Abweichung umsetzbare Vorschläge auf Wort-, Satz- und Absatzebene.

### Schritt 6: Bericht

1. Gewichtete Summe berechnen, Obergrenzen anwenden
2. verdict festlegen (consistent / minor_drift / major_drift)
3. Abweichungen zusammenfassen
4. Vorschläge nach Priorität ordnen
5. `publish_allowed` immer `true`; unter 80 eine deutliche `warning`
6. Ein-Satz-Fazit mit dem Hinweis „Das ist ein Persona-Hinweis und hält dich nicht vom Posten ab.“

## Profil-Bezug

- **Mit Profil:** volle Prüfung über alle Dimensionen (Standardfall).
- **Ohne Profil:** **nicht möglich**. Auf das Anlegen eines Profils hinweisen und abbrechen. Dies ist der einzige
  SKILL in Postloop, der zwingend ein Profil braucht.

> Herkunft und Referenzprojekte siehe `EASEL-META.md` im selben Ordner.

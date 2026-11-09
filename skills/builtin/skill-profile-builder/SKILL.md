---
name: skill-profile-builder
description: "Ersteinrichtung: erstellt aus Social-Media-Links und Zielen ein Konto-Profil mit 6 Dimensionen. Verwenden, wenn der Nutzer ein Profil anlegen, sein Konto analysieren lassen oder zum ersten Mal starten will. Bestehende Profile bearbeitet skill-profile-manager."
layer: general
---

# Profil-Builder (Ersteinrichtung)

> Macht aus einem leeren oder halbleeren Profil ein brauchbares 6-Dimensionen-Profil. Beim ersten Start zuerst
> diesen SKILL nutzen: Social-Media-Links und Ziele sammeln → bisherige Posts und Vorlieben analysieren →
> 6 Dateien unter `profiles/<Name>/` erzeugen. Danach die Konto-Diagnose
> [account-diagnosis](../skill-account-diagnosis/SKILL.md) empfehlen.

## Abgrenzung zu profile-manager

- **profile-builder (dieser SKILL)** = Profil von 0 auf 1 **erstellen** (geführte Fragen + Link-Analyse + Zusammenführung).
- **profile-manager** = bestehende Profile anlegen/lesen/ändern/löschen, wechseln, Felder pflegen.

## Eingaben

Nur erfragen, was fehlt; nichts erfinden.

| Punkt | Bedeutung |
|----|------|
| Profilname | Eine Persona = ein Profil (nicht eine Plattform), z. B. „Match2Eat“ |
| Social-Media-Links | Profil-URLs (Instagram, TikTok, YouTube, X, LinkedIn, Website) zur Analyse bisheriger Posts |
| Ziele | Welche Richtung, warum, eigene Stärken und Ressourcen |
| Inhaltsvorlieben | Was gern konsumiert, was produziert werden soll, Vorbild-Konten |
| Tabus | Was ausdrücklich nicht gemacht wird, rechtliche Grenzen (z. B. Jugendschutz, Werbekennzeichnung, KI-Label) |

## Ausgabe

6 Dateien unter `profiles/<Profilname>/` (Aufbau siehe `profiles/_template/`):
`identity.md` / `style.md` / `audience.md` / `platforms.md` / `preferences.md` / `memory.md`.
Jedes Feld mit Quelle kennzeichnen: `[Eigenangabe]` / `[Link-Analyse]` / `[offen]`.

## Ablauf

1. **Profilnamen festlegen** und prüfen, ob `profiles/<Name>/` existiert (falls ja: überschreiben oder ergänzen?). Sonst `profiles/_template/` als Gerüst kopieren.
2. **Links sammeln** nach der Checkliste [onboarding-questions.md](references/onboarding-questions.md) (auf Chinesisch, sinngemäß übertragen).
3. **Links analysieren** nach [social-link-analysis.md](references/social-link-analysis.md): öffentlich abrufbare Inhalte per web_fetch lesen (letzte Posts: Titel, Themen, Interaktionen) und ableiten: häufige Themen, Stil und Ton, Zielgruppe, Merkmale gut laufender Posts.
   - Instagram und TikTok sperren automatisches Abrufen meist: dem Nutzer klar sagen, was nicht ging, und stattdessen nachfragen. **Keine Daten erfinden.**
4. **Ziele und Vorlieben erfragen**, Dimension für Dimension: Richtung, Gründe, Stärken/Ressourcen, Vorlieben, Vorbilder, Tabus.
5. **6 Dimensionen zusammenführen** ([Link-Analyse] + [Eigenangabe]) entlang der Felder in `profiles/_template/`:
   - identity ← Positionierung, Alleinstellung, Inhaltsrichtung
   - style ← Ton, Einstiegsmuster, Bildsprache, Tempo, Markenzeichen (häufige Muster aus der Analyse zuerst)
   - audience ← Kernzielgruppe, Interessen, Probleme, Interaktionsverhalten
   - platforms ← Kontoname, Follower-Größenordnung, Formate je Plattform
   - preferences ← Machen / Nicht machen / Rechtliches; bei KI-Inhalten „immer KI-Label“ eintragen
   - memory ← zunächst leer oder nur erste Erkenntnisse aus der Link-Analyse
6. **Lücken markieren und nachfragen:** Fehlende Angaben als `[offen]` eintragen und **konkrete Fragen** auflisten, statt mit Floskeln aufzufüllen.
7. **Speichern und zusammenfassen:** Dateien schreiben und kurz berichten: Vollständigkeit je Dimension, was aus Links stammt, was offen ist; als nächsten Schritt account-diagnosis vorschlagen.

## Profil-Bezug

Dieser SKILL **erzeugt** Profile, er nutzt keins. Die Qualität hängt davon ab, wie viel aus den Links lesbar ist und
wie vollständig die Angaben des Nutzers sind.

---
name: skill-cross-platform-publish
description: >-
  Ein Inhalt für Instagram, TikTok, YouTube Shorts und X: pro Plattform anpassen, Limits mit
  scripts/publish_dispatch.py prüfen, Export-Paket zum Selbst-Posten. Verwenden, wenn der Nutzer
  auf mehreren Plattformen posten oder für Insta und TikTok anpassen will.
layer: publish
---

# Mehrere Plattformen bespielen

> Ein Entwurf → pro Plattform angepasst → Limits geprüft → **Export-Paket zum Selbst-Posten**.
> Du (LLM) passt den Inhalt an. `scripts/publish_dispatch.py` prüft Limits und sagt, wie gepostet wird.
> **Antworte dem Nutzer auf Deutsch, außer er schreibt in einer anderen Sprache.**

## Plattformen und Weg zum Posten

| Plattform | `publisher` | Weg |
|---|---|---|
| instagram | manual-export | Export-Paket, Nutzer postet selbst |
| tiktok | manual-export | Export-Paket, Nutzer postet selbst |
| youtube-shorts | manual-export | Export-Paket, Nutzer postet selbst (nur Video) |
| twitter-x | web_publisher | Automatisch per Browser-Login möglich, sonst Export-Paket |

`python skills/builtin/skill-cross-platform-publish/scripts/publish_dispatch.py platforms` zeigt alle Limits.

**`manual-export` heißt: Du rufst kein Veröffentlichungs-Skript auf und behauptest nie, etwas sei gepostet.**
Du schickst den Nutzer in Postloop zu **Veröffentlichen → Export-Tab**. Dort prüft er jede Version,
beantwortet die Pflichtfrage zur KI-Kennzeichnung und lädt das ZIP-Paket herunter. Im Paket stehen
Texte, Medien und eine Schritt-für-Schritt-Anleitung (`ANLEITUNG.txt`).

## Eingabe

```json
{
  "content": {"title": "...", "body": "...", "tags": ["...", "..."], "media_type": "video"},
  "platforms": ["instagram", "tiktok", "youtube-shorts"]
}
```

## Ablauf

1. Plan erzeugen (Limits prüfen, Weg je Plattform):
   ```bash
   python skills/builtin/skill-cross-platform-publish/scripts/publish_dispatch.py plan --manifest content.json
   ```
2. **Pro Plattform anpassen** (deine Aufgabe):
   - `constraints_note` und `warnings` abarbeiten: Text kürzen, Hashtags reduzieren, Format wechseln.
   - Bei falschem Seitenverhältnis (`recommend_aspect`) **video-reframe** nutzen, z. B. 16:9 → 9:16.
   - Ton je Plattform: Instagram visuell und persönlich, TikTok schnell mit Hook in der ersten Sekunde,
     YouTube Shorts mit klarem, suchbarem Titel, X knapp und pointiert.
3. **Persona-Check** (wenn ein Profil existiert, siehe AGENTS.md): skill-persona-check laufen lassen,
   Ergebnis mit `python skills/shared/scripts/persona_gate.py check --score 85` bewerten. Unter 80 Punkten:
   Punktzahl, Abweichungen und Vorschläge nennen, aber nicht blockieren.
4. **KI-Kennzeichnung ansprechen:** Enthält der Beitrag KI-generierte Bilder, Videos, Stimmen oder
   Personen, sag das dem Nutzer ausdrücklich. Er muss es im Export-Tab mit „Ja“ angeben; das Paket
   enthält dann die Plattform-Schalter (Instagram „KI-Label“, TikTok „KI-generierte Inhalte“,
   YouTube „Veränderte oder synthetische Inhalte“) und den Hinweistext „Mit KI erstellt“.
5. **Übergabe:** Die angepassten Versionen ausgeben und auf den Export-Tab verweisen.
6. Nach dem Posten trägt der Nutzer den Link im Export-Tab ein. Für die Auswertung kannst du den
   Schritt protokollieren:
   ```
   python skills/shared/scripts/manifest.py record --topic <Thema> \
     --layer publish --skill skill-cross-platform-publish --profile <Profil> \
     --upstream outputs/<Thema>/post.md --summary "Export für Instagram/TikTok erstellt"
   ```

## Profil

- Mit Profil: Zielplattformen aus `platforms.md`, Ton aus `style.md`, Grenzen aus `preferences.md`.
- Ohne Profil: nach den Zielplattformen fragen.

## Regeln

1. Nie denselben Text unverändert überall posten – jede Plattform bekommt ihre Version.
2. Erst `plan`, dann alle `warnings` beheben.
3. Bei `manual-export` niemals behaupten, etwas sei veröffentlicht oder hochgeladen.
4. KI-Inhalte nie verschweigen; Kennzeichnung ist Pflicht der Plattformen und nach EU AI Act Art. 50.
5. Für Posts zu festen Zeiten: **skill-publish-scheduler**.

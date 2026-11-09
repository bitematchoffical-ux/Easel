# Postloop – Stand und Übergabe

Stand: 2026-11-09. Diese Datei ist die Übergabe zwischen Rechnern bzw. Claude-Sitzungen.
Zuerst lesen, dann [ANALYSE-EU.md](../ANALYSE-EU.md) für den Gesamtplan.

## Was Postloop ist

Fork von [ZJU-REAL/Easel](https://github.com/ZJU-REAL/Easel) (Apache 2.0), umgebaut für Europa:
lokaler KI-Agent für Social-Media-Content (Instagram, TikTok, YouTube Shorts, X). Erstes Ziel ist ein
Werkzeug für die eigene Match2Eat-Kampagne, kein eigenes Produkt.

## Fertig (Branch `eu/ui-de`, enthält alles der Reihe nach)

| Commit | Inhalt |
|---|---|
| `e61b6ab` Paket A | China-Plattformen, AGPL-Teile (gzh-design, PyMuPDF) und Easel-Branding entfernt, Name Postloop |
| `0226c7a` Paket B | Export-Pakete für Instagram/TikTok/YouTube Shorts/X, Pflichtfrage zur KI-Kennzeichnung |
| `3855257` Paket C | Weboberfläche nur auf 127.0.0.1, Kostenschutz gegen Token-Explosion (Upstream-Issue #163), KI wird gekennzeichnet statt verschleiert |
| `0de6d63` Skills | Persona (SOUL.md, AGENTS.md), Profil-Vorlage und 12 Kern-Skills auf Deutsch; Fixes in wordcount (Umlaute), asr (Untertitelzeilen), tts (deutsche Stimme) |
| `2d24ba5` Oberfläche | Weboberfläche auf Deutsch (1.505 Texte) |
| (offen) Ohne Chinesisch | Startseiten-Trends auf Google Trends DE/AT/CH, Reddit r/de, Tagesschau; alle 90 Skill-Beschreibungen deutsch; Skill-Details ohne chinesische Anleitung (Hinweis statt Original); Einstellungen, Konten, Chat-Statusmeldungen und Chat-Titel deutsch |

Tests: Python 1580 grün, Frontend 142/142. Ein Test (`test_installers_degrade_on_invalid_input_and_unsupported_schema[bash]`)
schlägt auf macOS fehl, aber genauso im Original (alte macOS-bash), kein Fehler von uns.

## Einrichten auf einem neuen Mac

```bash
git clone https://github.com/bitematchoffical-ux/Easel.git postloop
cd postloop
git checkout eu/ui-de
bash setup.sh            # Python-venv, Abhängigkeiten, OpenClaw, Chromium, Frontend-Build
source .venv/bin/activate
easel doctor             # prüft die Umgebung
easel web                # http://localhost:7860
```

Danach im Browser: **Einstellungen → Modelle** den Anthropic-API-Schlüssel selbst eintragen.
Vorher in der Anthropic Console (console.anthropic.com) ein **monatliches Ausgabenlimit** setzen; das ist die
einzige harte Kostengrenze.

Tests laufen lassen:

```bash
.venv/bin/python -m pytest -q -o faulthandler_timeout=90
cd web/frontend && node --test ../../tests/frontend/*.test.mjs
```

## Wichtige Entscheidungen

- **Denktiefe begrenzt:** `agents.defaults.thinkingDefault = low` in `~/.openclaw-easel/openclaw.json`. Mit dem
  Standard (adaptiv) hat Sonnet 4.6 beim ersten Karussell-Versuch zweimal das ganze Ausgabelimit (32k Tokens) fürs
  Nachdenken verbraucht und nichts erzeugt. Mit `low` lief derselbe Auftrag in ca. 5 Minuten durch.
- **Hauptmodell muss `anthropic/…` sein**, nicht `claude-cli/…`: Sonst nutzt OpenClaw den Claude-Code-Login des
  Rechners statt des API-Schlüssels („OAuth session expired“).
- **Mac mini:** System-Python ist 3.9; `.venv` mit Homebrew-Python 3.12 anlegen und `setup.sh` mit aktivierter
  `.venv` starten. Tests mit `PATH="$PWD/.venv/bin:$PATH"` laufen lassen.

- **Kein automatisches Posten auf Instagram/TikTok per Browser-Automatisierung** (Account-Sperre). Bis die offiziellen
  APIs da sind: Export-Paket, der Nutzer postet selbst. X kann weiterhin per Browser-Login posten.
- **Budget-Plugin `agents/tool-budget` bewusst nicht aktiviert**: an OpenClaw 2026.10.2 gebunden, bei anderer Version
  kann es alle Werkzeuge sperren. Stattdessen Schleifenschutz in den Installern, Regeln in AGENTS.md und ein neuer
  Hinweis pro Nachricht in `easel/persona.py`.
- **Chinesische Datenwerte im Code nicht übersetzen**, wenn das Backend sie speichert oder vergleicht
  (z. B. `主`/`备`, `已配置`, `缺`, `本机` in `SettingsPanel.tsx`, Marker `【附件素材】` in `store.ts`).
- Technischer Name bleibt vorerst `easel` (Befehl, Python-Paket, `EASEL_*`-Variablen); sichtbar heißt es Postloop.
- KI-Inhalte werden immer gekennzeichnet (Plattform-Schalter + „Mit KI erstellt“, EU AI Act Art. 50).

## Nächste Schritte (Reihenfolge)

1. ~~OpenClaw einrichten~~ (erledigt auf dem Mac mini, 9.11.).
2. ~~Match2Eat-Profil anlegen~~ (`profiles/match2eat/`, nicht im Repo).
3. Probelauf erledigt (Karussell `outputs/match2eat-mir-egal/`, Reel-Skript im Chat). Offen: Fehler der Karten
   beheben (Wasserzeichen überlappt Fußzeile, gerade statt typografische Anführungszeichen), Freigabe durch David.
4. Backend-Texte auf Deutsch (`web/app.py`: Plattformname „推特 X“, Einstellungs-Labels, Fehlermeldungen).
   Vorsicht bei Werten, die das Frontend vergleicht (siehe oben).
5. Paket E: Trendquellen für EU (Google Trends, TikTok Creative Center, Reddit) statt Weibo/Douyin/Zhihu
   (`easel/trends/builtin.py`, `easel/trends/sources.py`).
6. Toten China-Code entfernen (unerreichbare Zweige in `web/app.py`, `skills/shared/scripts/account_stats.py`,
   `platform_readback.py`).
7. Übrige ~90 SKILL.md und die Referenzdateien übersetzen.
8. Offizielle APIs: Meta-App-Prüfung (Instagram), TikTok Content Posting API (Freigabe nötig), YouTube Data API.
   Konten laufen voraussichtlich über einen Erwachsenen (wie das Apple-Developer-Konto).

## Werkzeuge der Übersetzung

Die Oberfläche wurde mit zwei Node-Skripten übersetzt (TypeScript-AST): eines sammelt sichtbare chinesische Texte und
markiert Logik-Vorkommen, das andere setzt eine Zuordnung positionsgenau ein. Sie lagen nur im Arbeitsordner der
Sitzung; bei Bedarf neu schreiben (Prinzip: StringLiteral/Template/JsxText ersetzen, Vergleiche, `case`,
Objektschlüssel, `includes`/`startsWith`/`split` und Regex auslassen).

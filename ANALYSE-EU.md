# Easel → Europa-Fork: Code-Analyse

Stand: 2026-11-08 · Fork: github.com/bitematchoffical-ux/Easel · Upstream: ZJU-REAL/Easel (Remote `upstream`)
Nur gelesen, nichts installiert oder ausgeführt.

## 1. Wie Easel gebaut ist

| Teil | Wo | Was |
|---|---|---|
| Agent | OpenClaw (externes npm-Paket), Config in `agents/openclaw.json5` | Das eigentliche „Gehirn“. Easel selbst ist kein Agent, sondern Skills + Oberfläche um OpenClaw herum. |
| Skills | `skills/builtin/` (118 Ordner) | Jeder Skill = `SKILL.md` (Anleitung für den Agenten, auf Chinesisch) + optional Skripte. |
| Werkzeug-Skripte | `skills/shared/scripts/` (~55 Python-Dateien) | Bild, Video, TTS, Untertitel, Login, Veröffentlichen. Hier steckt die echte Arbeit. |
| Backend | `web/app.py` (5.788 Zeilen, FastAPI, eine einzige Datei) | Accounts, Login, Veröffentlichen, Trends, Chat. |
| Frontend | `web/frontend/src` (React, 30 Komponenten) | Komplett chinesisch, **kein i18n-System**: 41 Dateien mit fest eingebauten chinesischen Texten. |
| Trends | `easel/trends/` | Eingebaut: Weibo, Baidu, Zhihu, Douyin, Toutiao, Bilibili + HackerNews/GitHub. Eigene Quellen per Protokoll (Python-Skript, HTTP, RSS) möglich – das ist gut gebaut. |

## 2. Wie Plattformen angebunden sind (der Kernpunkt)

- **Alles läuft über Browser-Automatisierung (Playwright)**, nicht über APIs. Login = QR-Code abfotografieren, Cookies speichern. Veröffentlichen = Klickschritte mit CSS-Selektoren.
- Plattformen sind in einem Dict `PLATFORMS` in `skills/shared/scripts/web_publisher.py` (2.183 Zeilen) beschrieben: Login-URL, Selektoren, Klickschritte. Dazu eigene Großskripte für Xiaohongshu (1.532 Z.) und Douyin (1.529 Z.).
- Die Plattformliste ist **an mindestens 5 Stellen doppelt gepflegt**: `web_publisher.py`, `easel/manual_publish.py`, `web/app.py` (`ANALYTICS_PLATFORMS`), `asset-manager/scripts/assets.py`, `skill-wechat-publisher/scripts/multi_publish.py` – plus Frontend.
- Es gibt **kein OAuth**. Für Instagram/TikTok/YouTube über offizielle APIs fehlt der ganze Unterbau: Redirect-Endpunkt, Token speichern und erneuern, App-Freigaben.
- Positiv: Es gibt schon einen **manuellen Modus** (`easel/manual_publish.py`): Er packt Text + Medien als ZIP zum Selbst-Posten, ohne die Plattform zu berühren. Den kann man sofort für Instagram/TikTok nutzen.

Die Selektoren-Logik ist sehr zerbrechlich (Kommentare wie „2026-07 实测：改版，旧选择器已失效“). Für Europa lohnt es sich nicht, das nachzubauen – offizielle APIs sind stabiler und gefährden den Account nicht.

## 3. Lizenzen – wichtig, bevor man es nutzt oder verkauft

| Teil | Lizenz | Folge |
|---|---|---|
| Easel selbst | Apache 2.0 | Fork, Umbau, kommerzielle Nutzung ok. Name/Logos nicht übernehmen. Geänderte Dateien kennzeichnen. |
| Skill `gzh-design` | **AGPL-3.0** | WeChat-Layout, für Europa nutzlos → **gelöscht (Paket A)**. Sonst müsste bei einer gehosteten Version der ganze Code offengelegt werden. |
| `PyMuPDF` (Abhängigkeit) | **AGPL-3.0** (oder kaufen) | Nur für Paper-Skills nötig → rauswerfen oder optional machen, falls je gehostet/verkauft. |
| `edge-tts` | GPL-3.0, nutzt inoffiziell Microsofts Edge-Vorlesedienst | Rechtlich wackelig → durch ElevenLabs/OpenAI-TTS ersetzen. |
| Remotion (in `video-production/vendor`) | Remotion-Lizenz | Frei für Einzelpersonen/kleine Teams; ab Firma mit >3 Leuten kostenpflichtig. |
| paper2video, paper-promotion, video-pipeline-sdk | Apache 2.0 / MIT | Unkritisch. |
| xhs-Publisher | „nach Vorbild von xiaohongshu-mcp“ | Fliegt für Europa sowieso raus. |

## 4. Was für Europa rausfliegt / bleibt / neu kommt

**Raus (China-spezifisch):** xhs-*, douyin, kuaishou, channels, bilibili, zhihu-*, toutiao, wechat-*, gzh-design, card-xiaohongshu, xhs-note-creator, Trends Weibo/Baidu/Zhihu/Douyin/Toutiao, `jieba`/`snownlp`/`biliup`. Grob 20 Skills.

**Bleibt (plattformneutral, der eigentliche Wert):** Profil/Persona, Content-Kalender, Hook-Generator, Themen-Bewertung, Content-Repurposing, Bild-/Video-/Audio-Werkzeuge, Untertitel, Qualitäts-Check, Risiko-Scanner, Auswertung. Problem: alle `SKILL.md` sind chinesisch und auf chinesische Plattformlogik getrimmt → müssen übersetzt und angepasst werden.

**Neu:**
1. OAuth-Unterbau + Instagram Graph API (Reels, Karussell), TikTok Content Posting API, YouTube Data API (Shorts).
2. Trendquellen: Google Trends, TikTok Creative Center, Reddit, YouTube-Trends (über das vorhandene Quellen-Protokoll – relativ einfach).
3. KI-Kennzeichnung (EU AI Act Art. 50 + Plattform-Labels) als Pflichtschritt vor dem Posten.
4. Oberfläche auf Deutsch/Englisch mit i18n.
5. Kostendeckel pro Aufgabe (Upstream-Issue #163) und Gateway nicht mehr im ganzen Netzwerk offen (`bind: "lan"` ohne Login).

## 5. Aufwand (grobe Schätzung, mit Claude als Hilfe)

| Paket | Aufwand | Anmerkung |
|---|---|---|
| A. Ausmisten: China-Skills, AGPL-Teile, Branding raus, neuer Name | 1–2 Tage | Mechanisch. |
| B. Manueller Modus für Instagram/TikTok (Paket zum Selbst-Posten, mit KI-Label-Hinweis) | ½–1 Tag | **Schnellster Nutzen für die Match2Eat-Kampagne.** |
| C. Kostendeckel + Gateway absichern | ½ Tag | |
| D. Wichtigste ~25 Skills auf Deutsch/Englisch umschreiben | 3–5 Tage | Text-Arbeit. |
| E. Trendquellen EU | 1–2 Tage | |
| F. OAuth + Instagram-API | 3–5 Tage + Wartezeit | Meta-App-Review dauert Tage bis Wochen; Business-Konto nötig. |
| G. TikTok-API | 2–4 Tage + Audit | Ohne Audit sind Posts nur privat sichtbar. |
| H. Frontend i18n | 3–5 Tage | 41 Dateien mit festem Text. |

**Gesamt bis „EU-tauglich mit API-Posten“: grob 3–5 Wochen Nebenbei-Arbeit.**
Bis „nützlich für die eigene Kampagne“ (A + B + C + ein Teil von D): **etwa eine Woche.**

## 6. Empfehlung

1. Erst A + B + C: ein schlanker Fork, der Inhalte erstellt und Pakete zum Selbst-Posten auf Instagram/TikTok baut. Sofort nutzbar, kein Risiko für den Account, keine API-Freigaben nötig.
2. Parallel Meta-Business-Konto + App-Review anstoßen (läuft über deinen Vater, wie beim Apple-Konto), weil das am längsten dauert.
3. Erst danach F/G (echtes API-Posten) und H (i18n).
4. Upstream-Änderungen nur selektiv übernehmen – nach dem Ausmisten wird ein automatisches Mergen immer schwieriger.

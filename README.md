<p align="center">
  <img src="web/static/postloop-icon.svg" width="96" alt="Postloop">
</p>

<h1 align="center">Postloop</h1>

<p align="center">
  Lokaler KI-Assistent für Social-Media-Content in Europa:<br>
  Trends finden → planen → erstellen → posten → auswerten → daraus lernen.
</p>

> **Status: frühe Umbauphase.** Postloop ist ein Fork von [Easel](https://github.com/ZJU-REAL/Easel)
> (Apache 2.0). Die China-Plattformen sind entfernt, Instagram/TikTok/YouTube werden gerade angebunden.
> Teile der Oberfläche und der Skills sind noch auf Chinesisch.

## Was Postloop anders macht als das Original

- **Europa statt China:** Xiaohongshu, Douyin, Kuaishou, WeChat, Zhihu, Bilibili, Toutiao und Juejin sind raus.
  Ziel sind Instagram, TikTok, YouTube und LinkedIn – über die **offiziellen Schnittstellen**, nicht über
  Browser-Automatisierung, damit Accounts nicht gesperrt werden.
- **Lizenzsauber:** AGPL-Bestandteile (`gzh-design`, `PyMuPDF`) sind entfernt.
- **Geplant:** KI-Kennzeichnung nach EU AI Act Art. 50, DSGVO-freundlich lokal, Deutsch/Englisch,
  Kostendeckel pro Aufgabe, Trendquellen für DACH/EU.

Der Umbauplan steht in [ANALYSE-EU.md](ANALYSE-EU.md).

## Was heute schon geht

- Account-Profil (Stil, Zielgruppe, Erfahrungen) als Gedächtnis für den Agenten
- Content-Kalender, Themenbewertung, Hooks, Content-Repurposing
- Bild-, Karussell-, Video-, Audio- und Untertitel-Werkzeuge
- Veröffentlichen auf X (Browser-Login) und Export-Pakete zum Selbst-Posten

## Installation

Voraussetzungen: macOS, Linux oder Windows 10/11, Python 3.10+, Node.js 24.16+ (24.x) oder 26.1+, Git, FFmpeg.

```bash
git clone https://github.com/bitematchoffical-ux/Easel.git postloop
cd postloop
bash setup.sh
source .venv/bin/activate
easel doctor
easel web        # http://localhost:7860
```

Der Befehl heißt technisch noch `easel`; die Umbenennung folgt später.
Den Modell-Schlüssel (z. B. `ANTHROPIC_API_KEY`) trägst du nach dem Start im Browser unter Einstellungen ein.

## Herkunft und Lizenz

Postloop basiert auf **Easel** von ZJU-REAL (Zhejiang University, Peking University, REAL Lab, OpenDCAI Lab),
veröffentlicht unter der Apache License 2.0. Postloop steht ebenfalls unter Apache 2.0, siehe [LICENSE](LICENSE)
und [NOTICE](NOTICE). „Easel“ und die Logos der ursprünglichen Autoren sind deren Kennzeichen und werden hier
nicht als Marke verwendet. Postloop ist kein offizielles Produkt der ursprünglichen Autoren.

/* 能力菜单数据（笔入口「能做的都在这」用）
 * 115 个技能的展示名/分组/状态 + 整片管线接入位。
 * 技能集更新时随技能库重新生成。 */
export interface CapabilityItem { id?: string; label: string; desc?: string; skill?: string | null; status?: string; }
export interface CapabilityGroup { id?: string; label: string; items: CapabilityItem[]; }
export interface CapabilityTab { id: string; label: string; groups: CapabilityGroup[]; }
export const CAPABILITY_MENU: { meta?: unknown; tabs: CapabilityTab[] } = {
 "meta": {
  "name": "Postloop-Funktionsmenü",
  "version": "v1-draft",
  "date": "2026-10-03",
  "legend": {
   "done": "Erprobt (echt gelaufen · mit Ergebnis)",
   "ready": "Verfügbar (Werkzeuge bereit · noch nicht echt gelaufen)",
   "need": "Einrichtung nötig (Schlüssel / Login / externer Dienst)",
   "incoming": "In Arbeit"
  },
  "counts": {
   "done": 7,
   "ready": 97,
   "need": 10,
   "incoming": 1
  }
 },
 "tabs": [
  {
   "id": "make",
   "label": "Inhalte machen · fertige Ergebnisse",
   "groups": [
    {
     "id": "visual",
     "label": "Grafiken und Bilder",
     "items": [
      {
       "skill": "card-xiaohongshu",
       "label": "Instagram-Karussell",
       "desc": "Rendert vorhandene Kartentexte als Instagram-Karussell (1080×1350) im gewählten Stil aus card-design.",
       "status": "ready"
      },
      {
       "skill": "card-quote",
       "label": "Zitat- / Zahlenkarte",
       "desc": "16:9-Querformat-Karten für eine starke Aussage oder Zahl, z. B. für X, LinkedIn oder YouTube-Community.",
       "status": "done"
      },
      {
       "skill": "card-design",
       "label": "Karten-Designsystem",
       "desc": "Designsystem für Social-Media-Karten: Farben, Schrifthierarchie, Layouts, Gerüste und Qualitätsprüfung gegen leere Flächen und billige KI-Optik.",
       "status": "done"
      },
      {
       "skill": "comparison-card",
       "label": "Vergleichsgrafik / Infoblatt",
       "desc": "A-vs-B-Vergleiche, Vor-/Nachteil-Tabellen und Produktdaten auf einen Blick, als HTML gerendert und als Bild exportiert.",
       "status": "ready"
      },
      {
       "skill": "poster-hero",
       "label": "Hochformat-Poster",
       "desc": "1080×1920 Werbeposter / Story-Grafik mit großer Headline, Nutzen und optionalem QR-Code für Launches und Aktionen.",
       "status": "ready"
      },
      {
       "skill": "infographic",
       "label": "Infografik (auch GIF)",
       "desc": "Macht aus Daten oder Text eine Infografik, statisch (AntV) oder als animiertes GIF: Abläufe, Vergleiche, Diagramme, SWOT.",
       "status": "ready"
      },
      {
       "skill": "mindmap",
       "label": "Mindmap",
       "desc": "Rendert eine Markdown-Gliederung als interaktive Mindmap (HTML), optional als PNG: Wissensstrukturen, Inhaltsgerüste, SWOT.",
       "status": "ready"
      },
      {
       "skill": "meme-generator",
       "label": "Memes",
       "desc": "Meme-Generator: klassische Ober-/Unterzeile (weiß mit schwarzem Rand) oder Reaktionsbild mit Textleiste, automatischer Umbruch und Schriftgröße.",
       "status": "ready"
      },
      {
       "skill": "data-report",
       "label": "Datenbericht",
       "desc": "Macht aus CSV, Excel oder JSON eine Berichtsseite mit KPIs, Diagrammen und Erkenntnissen.",
       "status": "ready"
      },
      {
       "skill": "ecom-details-image",
       "label": "Produktbilder",
       "desc": "Bildkonzepte für Produkte: Hauptbild, Szenenbilder, Bildrichtung für Produktseiten und Prompts für KI-Bilder.",
       "status": "ready"
      },
      {
       "skill": "chart-visualization",
       "label": "Diagramme (25+ Typen)",
       "desc": "Visualisiert Daten als Diagramm: Balken, Linien, Torte, Streuung, Radar, Sankey, Abläufe u. v. m. über die AntV-API.",
       "status": "need"
      },
      {
       "skill": "ai-image-gen",
       "label": "KI-Bilder",
       "desc": "Allgemeine KI-Bildgenerierung: Text zu Bild, Bild zu Bild, Varianten und Bearbeitung. Ergebnisse als KI-Inhalt kennzeichnen.",
       "status": "need"
      },
      {
       "skill": "image-editing",
       "label": "Bildbearbeitung",
       "desc": "Größe ändern, zuschneiden, für Plattformformate auffüllen, Format wandeln (png/jpg/webp), komprimieren, Wasserzeichen, Collagen, Vorschaubilder.",
       "status": "ready"
      },
      {
       "skill": "image-enhance",
       "label": "Bildverbesserung",
       "desc": "Hochwertig vergrößern (2×/4×), entrauschen, schärfen, Kontrast und Sättigung automatisch anpassen.",
       "status": "ready"
      },
      {
       "skill": "remove-bg",
       "label": "Freistellen / Hintergrund",
       "desc": "Motiv per KI freistellen: transparentes PNG, weißer Hintergrund oder neue Szene, ohne Greenscreen.",
       "status": "ready"
      }
     ]
    },
    {
     "id": "writing",
     "label": "Texte und Artikel",
     "items": [
      {
       "skill": "xhs-note-creator",
       "label": "Xiaohongshu-Paket (Original)",
       "desc": "Gesamtpaket für Xiaohongshu-Posts aus dem Original (Titel, Text, Karten, Hashtags). Für Instagram besser Karussell-Planung + Instagram-Karussell.",
       "status": "ready"
      },
      {
       "skill": "copywriting",
       "label": "Werbe- / Verkaufstexte",
       "desc": "Verkaufsstarke Texte: Nutzen herausarbeiten, Headlines, Text und CTA für Anzeigen, Aktionen, Produkt- und Landingpages, App Store.",
       "status": "ready"
      },
      {
       "skill": "post-formatter",
       "label": "Strukturierter Post",
       "desc": "Strukturiert ein Thema mit PAS, AIDA, BAB, STAR oder SLAY als Post: 200–250 Wörter, mobil lesbar, z. B. für LinkedIn.",
       "status": "ready"
      },
      {
       "skill": "social-content",
       "label": "Social-Media-Post",
       "desc": "Organische Posts für Instagram, TikTok, YouTube Shorts, X und LinkedIn: Hook, Text, Hashtags, Interaktion. Standard bei unklarer Plattform.",
       "status": "done"
      },
      {
       "skill": "novel-writer",
       "label": "Fortsetzungsroman",
       "desc": "Lange Geschichten in Fortsetzungen: Welt, Figuren, Gliederung und Kapitel, mit Dateien für Vorausdeutungen und Stimmigkeit.",
       "status": "ready"
      },
      {
       "skill": "video-script",
       "label": "Videoskript",
       "desc": "Videoskripte von 7 Sekunden bis 30 Minuten: bewertete Hooks, Sekunden-Timing, Untertitel, Cover; bei längeren Videos Retention und Kapitel.",
       "status": "ready"
      },
      {
       "skill": "video-to-article",
       "label": "Video zu Text",
       "desc": "Macht aus Talking Head, Vortrag, Livestream oder Vlog einen Artikel oder Post mit Standbildern als Illustration.",
       "status": "ready"
      },
      {
       "skill": "style-transfer",
       "label": "Stil übertragen",
       "desc": "Schreibt Text in einen anderen Stil um (ernst → witzig, schriftlich → gesprochen, formell → Social Media), auch nach Beispieltext.",
       "status": "ready"
      },
      {
       "skill": "text-polisher",
       "label": "Überarbeiten / KI-Ton entfernen",
       "desc": "Textüberarbeitung in sieben Durchgängen (Klarheit, Ton, Nutzen, Belege, Konkretheit, Gefühl, Risiko) und Entfernen typischer KI-Formulierungen.",
       "status": "ready"
      },
      {
       "skill": "text-condenser",
       "label": "Zusammenfassen / Kernsätze",
       "desc": "Kürzt lange Texte auf eine Zielzahl: hart kürzen, zusammenfassen oder nur die stärksten Sätze behalten.",
       "status": "ready"
      },
      {
       "skill": "doc-convert",
       "label": "Text zu PDF / Langbild",
       "desc": "Setzt Markdown als HTML, druckbares PDF oder langes PNG.",
       "status": "ready"
      }
     ]
    },
    {
     "id": "audio",
     "label": "Audio",
     "items": [
      {
       "skill": "tts-voiceover",
       "label": "Vertonung (mit Untertiteln)",
       "desc": "Text zu Sprache: Voiceover und Erzählung mit SRT. Mit VOICE_PROVIDER natürliche Cloud-Stimmen, sonst edge (deutsche Standardstimme Katja).",
       "status": "need"
      },
      {
       "skill": "voice-clone",
       "label": "Stimmklon",
       "desc": "Eigene Stimme aus einer Sprachprobe klonen und damit vertonen. Nur mit Einverständnis der Person; braucht einen Cloud-Anbieter.",
       "status": "need"
      },
      {
       "skill": "multi-voice-dubbing",
       "label": "Mehrere Sprecher",
       "desc": "Dialoge mit verteilten Stimmen und Emotionen pro Rolle, als mehrstimmige Tonspur mit Untertiteln samt Rollennamen.",
       "status": "ready"
      },
      {
       "skill": "audio-denoise",
       "label": "Entrauschen",
       "desc": "Entfernt Hintergrundgeräusche, Brummen, Wind und Rauschen aus Aufnahmen (ffmpeg-Filter).",
       "status": "ready"
      },
      {
       "skill": "audio-editing",
       "label": "Audio schneiden",
       "desc": "Audio schneiden, umwandeln (mp3/wav/m4a/aac), Lautheit angleichen, Tonspur aus Video holen, zusammenfügen, Ein-/Ausblenden, Tempo ändern.",
       "status": "ready"
      },
      {
       "skill": "audio-mix",
       "label": "Mischen (Ducking)",
       "desc": "Mischt Sprache, Musik und Effekte zu einer Spur; Musik wird automatisch wiederholt und unter der Stimme abgesenkt.",
       "status": "ready"
      },
      {
       "skill": "audio-visualizer",
       "label": "Audio-Visualisierung",
       "desc": "Macht aus reinem Audio (Podcast, Musik, Zitat) ein Video mit animierter Wellenform, Cover und Titel für Video-Plattformen.",
       "status": "ready"
      },
      {
       "skill": "ai-music",
       "label": "Musik / Hintergrundmusik",
       "desc": "KI-Musik für Kurzvideos und Posts über austauschbare Anbieter: Auftrag senden, warten, herunterladen, zuschneiden.",
       "status": "need"
      }
     ]
    },
    {
     "id": "video",
     "label": "Video",
     "items": [
      {
       "skill": "auto-short-video",
       "label": "Video aus einem Satz",
       "desc": "Vom Thema zum fertigen Kurzvideo: Text → Bilder/KI-Video → Vertonung → Untertitel → Musik → Schnitt in einer Pipeline.",
       "status": "ready"
      },
      {
       "skill": "beat-sync-video",
       "label": "Beat-Sync-Video",
       "desc": "Erkennt die Beats der Musik und schneidet Bilder oder Clips genau darauf, mit Zoom- und Blitzeffekten.",
       "status": "ready"
      },
      {
       "skill": "slideshow-video",
       "label": "Fotoalbum-Video",
       "desc": "Macht aus Bildern ein Video mit Ken-Burns-Bewegung, Übergängen, Musik und Untertiteln, passend fürs Plattformformat.",
       "status": "ready"
      },
      {
       "skill": "clipify",
       "label": "Lange Videos zerlegen",
       "desc": "Holt die besten Stellen aus langen Videos als eigene Kurzvideos, mit 16:9→9:16 und Wort-für-Wort-Untertiteln.",
       "status": "ready"
      },
      {
       "skill": "video-highlights",
       "label": "Highlight-Clips",
       "desc": "Findet Highlights in langen Videos oder Livestream-Aufzeichnungen (Lautstärkespitzen oder Inhalt) und macht daraus Kurzvideos.",
       "status": "ready"
      },
      {
       "skill": "auto-subtitle",
       "label": "Automatische Untertitel",
       "desc": "Erkennt Sprache in Audio/Video als Untertitel (SRT/ASS/TXT/JSON) und brennt sie optional ein.",
       "status": "ready"
      },
      {
       "skill": "subtitle-translate",
       "label": "Untertitel übersetzen",
       "desc": "Übersetzt Untertitel (SRT/VTT/ASS) in eine Zielsprache, zweisprachig oder nur Übersetzung, optional eingebettet oder eingebrannt.",
       "status": "ready"
      },
      {
       "skill": "video-chapters",
       "label": "Kapitel / Zeitmarken",
       "desc": "Kapitel und Zeitmarken für längere Videos, z. B. für YouTube-Kapitel und die Videobeschreibung.",
       "status": "ready"
      },
      {
       "skill": "video-editing",
       "label": "Schnitt per Sprache",
       "desc": "Videos per Anweisung schneiden: kürzen, zusammenfügen, Tempo, Pausen entfernen, Texteinblendungen, Formatwechsel, Cover, GIF, Musik, Wasserzeichen (ffmpeg).",
       "status": "ready"
      },
      {
       "skill": "video-intro-outro",
       "label": "Intro / Outro",
       "desc": "Intro- und Outro-Karten mit Titel, Untertitel, Logo und Folgen-Aufruf erzeugen und ans Video setzen (harter Schnitt oder Blende).",
       "status": "ready"
      },
      {
       "skill": "video-reframe",
       "label": "Format umwandeln",
       "desc": "Wandelt Videoformate um (9:16/16:9/1:1) mit unscharfem Hintergrund, Fokuszuschnitt oder Gesichtszentrierung.",
       "status": "ready"
      },
      {
       "skill": "green-screen",
       "label": "Greenscreen",
       "desc": "Greenscreen-Freistellung und Compositing: Person vor neuen Hintergrund (Bild, Video, Farbe oder unscharf) setzen.",
       "status": "ready"
      },
      {
       "skill": "short-drama",
       "label": "KI-Kurzserie",
       "desc": "Mehrteilige KI-Kurzserie: Serienbibel, Figurenreferenzen, Folgenskripte, Bild-zu-Video pro Szene, Vertonung, Untertitel und Musik, stimmig über alle Folgen.",
       "status": "need"
      },
      {
       "skill": "ai-video-gen",
       "label": "KI-Video",
       "desc": "KI-Videogenerierung: Text zu Video, Bild zu Video, Avatar. Über austauschbare Anbieter mit eigenem API-Schlüssel; als KI-Inhalt kennzeichnen.",
       "status": "need"
      },
      {
       "skill": null,
       "id": "video-pipeline",
       "label": "Video-Pipeline · großes Projekt",
       "desc": "Vom Rohmaterial zum fertigen Film: neun Schritte, sieben Prüfpunkte, zwei Bestätigungen; eigene Pipeline-Schnittstelle",
       "status": "incoming"
      }
     ]
    },
    {
     "id": "publish",
     "label": "Veröffentlichen",
     "items": [
      {
       "skill": "skill-cross-platform-publish",
       "label": "Mehrere Plattformen",
       "desc": "Ein Inhalt für Instagram, TikTok, YouTube Shorts und X: pro Plattform anpassen, Limits prüfen, Export-Paket zum Selbst-Posten.",
       "status": "ready"
      },
      {
       "skill": "skill-content-repurposing",
       "label": "Inhalte umarbeiten",
       "desc": "Arbeitet einen Inhalt für mehrere Plattformen um und passt Format und Stil jeweils an.",
       "status": "ready"
      },
      {
       "skill": "skill-short-link",
       "label": "Kurzlink / UTM",
       "desc": "Hängt UTM-Parameter (Quelle/Medium/Kampagne) an Links und kürzt sie, um Traffic-Quellen und Kampagnen zu messen.",
       "status": "ready"
      }
     ]
    }
   ]
  },
  {
   "id": "operate",
   "label": "Organisieren · Aktionen",
   "groups": [
    {
     "id": "discover",
     "label": "Entdecken und Themen",
     "items": [
      {
       "skill": "skill-trending-topics",
       "label": "Trendthemen",
       "desc": "Sammelt aktuelle Trends, filtert passende zum Konto und schlägt Remix-Themen vor (Quellen über den Trend-Radar einstellbar).",
       "status": "ready"
      },
      {
       "skill": "skill-news-intelligence",
       "label": "Branchen-Briefing",
       "desc": "Sammelt Branchennews und Plattform-Neuigkeiten passend zum Thema des Kontos und macht daraus ein Briefing mit umsetzbaren Themen.",
       "status": "ready"
      },
      {
       "skill": "skill-rss-aggregator",
       "label": "RSS-Feeds",
       "desc": "Sammelt RSS-/Atom-Feeds von Blogs, Medien und Newslettern, filtert nach Stichwort und Zeitraum und fasst sie zusammen.",
       "status": "ready"
      },
      {
       "skill": "skill-event-calendar",
       "label": "Feiertage / Anlässe",
       "desc": "Feiertage, Aktionstage, Shopping-Events und Branchentermine der nächsten Tage als Aufhänger für Inhalte.",
       "status": "ready"
      },
      {
       "skill": "skill-ugc-discovery",
       "label": "Fan-Inhalte (UGC)",
       "desc": "Findet Inhalte, Erwähnungen und Bewertungen von Fans zu Marke oder Konto und schlägt Interaktionen vor.",
       "status": "ready"
      },
      {
       "skill": "skill-algorithm-updates",
       "label": "Algorithmus-Änderungen",
       "desc": "Verfolgt Änderungen bei Algorithmus, Reichweite, Moderation und Monetarisierung der Plattformen und ihre Folgen für Creator.",
       "status": "ready"
      }
     ]
    },
    {
     "id": "plan",
     "label": "Planen und Positionieren",
     "items": [
      {
       "skill": "skill-positioning-analysis",
       "label": "Positionierung",
       "desc": "Findet die Nische: Markt scannen, Wettbewerber einordnen, Lücken erkennen und eine Positionierung in einem Satz formulieren.",
       "status": "ready"
      },
      {
       "skill": "skill-account-diagnosis",
       "label": "Konto-Diagnose",
       "desc": "Liest Profil und aktuelle Daten und diagnostiziert Fokus, Klarheit, Reichweitenprobleme und Phase, mit Ursache → Beleg → Empfehlung.",
       "status": "done"
      },
      {
       "skill": "skill-brand-onboarding",
       "label": "Marken-Interview",
       "desc": "Strukturiertes Interview zu Bildstil, Ton, Zielgruppe und Zielen; daraus entsteht ein vollständiges Konto-Profil.",
       "status": "ready"
      },
      {
       "skill": "skill-audience-profiler",
       "label": "Zielgruppe",
       "desc": "Zielgruppen-Persona: Merkmale, Probleme, Vorlieben und Kanäle der Follower als umsetzbare Karte.",
       "status": "ready"
      },
      {
       "skill": "skill-voice-builder",
       "label": "Sprachprofil",
       "desc": "Interview und Textproben ergeben ein Profil von Ton, Wortwahl und Rhythmus, damit alle Inhalte einheitlich klingen.",
       "status": "ready"
      },
      {
       "skill": "skill-content-strategy",
       "label": "Content-Strategie",
       "desc": "Gesamtstrategie: Inhaltssäulen, Zielgruppenpfad, 90-Tage-Rhythmus, Kanäle und KPIs als umsetzbares Dokument.",
       "status": "ready"
      },
      {
       "skill": "skill-content-matrix",
       "label": "Themenmatrix",
       "desc": "Kreuzt Inhaltssäulen mit Formaten zu einer Matrix; jedes Feld ergibt ein umsetzbares Thema.",
       "status": "ready"
      },
      {
       "skill": "skill-content-calendar",
       "label": "Monatsplan",
       "desc": "Monats-Redaktionsplan für Instagram, TikTok, YouTube Shorts und X: jeder Slot mit Thema, Aufhänger und Bildidee.",
       "status": "ready"
      },
      {
       "skill": "skill-topic-evaluator",
       "label": "Themenbewertung",
       "desc": "Bewertet ein Thema nach Reichweite, Passung, Abgrenzung, Aktualität, Monetarisierung, Aufwand und Risiko: machen, lassen oder anpassen.",
       "status": "ready"
      },
      {
       "skill": "skill-trend-rider",
       "label": "Trend aufgreifen",
       "desc": "Macht aus einem Trend oder Ereignis einen konkreten Plan passend zum Konto: Blickwinkel, Format, Titel, Risiken.",
       "status": "ready"
      },
      {
       "skill": "skill-hook-generator",
       "label": "Hooks",
       "desc": "6 Hook-Varianten zu jedem Thema nach bewährten Formeln, mit Zeichenprüfung.",
       "status": "ready"
      },
      {
       "skill": "skill-article-outline",
       "label": "Gliederung für Langtexte",
       "desc": "Gliederung mit H2/H3, Wortzielen pro Abschnitt, Platz für Grafiken und FAQ, z. B. für Blog oder LinkedIn-Artikel.",
       "status": "ready"
      },
      {
       "skill": "skill-carousel-planner",
       "label": "Karussell planen",
       "desc": "Plant Karussells: Cover-Hook, Ablauf, Text und Bild pro Karte, CTA und Caption, mit Interaktionsbewertung.",
       "status": "ready"
      },
      {
       "skill": "skill-campaign-planner",
       "label": "Kampagnen",
       "desc": "Kampagnenplan für Anlässe, Aktionen oder Launches: Ziele, Rhythmus (Vorlauf, Höhepunkt, Nachlauf), Inhalte, Influencer, Budget, Rechtliches.",
       "status": "ready"
      },
      {
       "skill": "skill-collab-proposal",
       "label": "Kooperationen",
       "desc": "Pläne für Markenkooperationen und Kollaborationen: Angebot an Marken, Preisrahmen, Konzept, Kennzeichnung als Werbung.",
       "status": "ready"
      },
      {
       "skill": "skill-livestream",
       "label": "Livestream",
       "desc": "Kompletter Livestream-Plan: Thema, Ablauf, Begrüßung, Übergänge, Aufrufe, Danke und Interaktion.",
       "status": "ready"
      },
      {
       "skill": "skill-competitor-analysis",
       "label": "Wettbewerbsanalyse",
       "desc": "Analysiert die Content-Strategie von Vergleichskonten: Themen, Formate, Erfolgsmuster, Interaktion, und zeigt Chancen zur Abgrenzung.",
       "status": "ready"
      },
      {
       "skill": "skill-content-gap-analysis",
       "label": "Inhaltslücken",
       "desc": "Findet Themen mit hoher Nachfrage und wenig Konkurrenz in der Nische.",
       "status": "ready"
      },
      {
       "skill": "skill-cross-platform-diff",
       "label": "Plattform-Unterschiede",
       "desc": "Wie dasselbe Thema auf verschiedenen Plattformen anders funktioniert: Format, Publikum, Sprache, Reichweitenlogik, Monetarisierung.",
       "status": "ready"
      },
      {
       "skill": "video-strategy",
       "label": "Video-Strategie",
       "desc": "Video-Strategie und Werkzeugwahl: KI-Videomodelle im Vergleich, Skriptaufbau, Produktionsablauf, Serienplanung.",
       "status": "ready"
      }
     ]
    },
    {
     "id": "ops",
     "label": "Veröffentlichen und Qualität",
     "items": [
      {
       "skill": "skill-publish-scheduler",
       "label": "Geplantes Posten",
       "desc": "Verwaltet einen Plan aus Inhalt × Plattform × Zeitpunkt, zeigt fällige Einträge und trägt den Status nach.",
       "status": "ready"
      },
      {
       "skill": "skill-publish-checklist",
       "label": "Checkliste vor dem Posten",
       "desc": "Prüft vor dem Posten Titel, Cover, Hashtags, Format, Kennzeichnungen, Links und CTA auf Vollständigkeit.",
       "status": "ready"
      },
      {
       "skill": "skill-quality-gate",
       "label": "Qualitätsprüfung",
       "desc": "Prüft Rechtliches (sensible Wörter, Superlative, Plattformregeln, Werbe- und KI-Kennzeichnung) und Qualität (Vollständigkeit, Lesbarkeit, Plattformpassung).",
       "status": "ready"
      },
      {
       "skill": "skill-risk-scanner",
       "label": "Urheberrecht / Originalität",
       "desc": "Schätzt Originalität und Urheberrechtsrisiken von Text und Material ein und prüft Zitate (Textanalyse, keine technische Plagiatsprüfung).",
       "status": "ready"
      },
      {
       "skill": "skill-seo-quality",
       "label": "Suche optimieren",
       "desc": "Optimiert Inhalte für die Suche in den Plattformen: Stichwörter in Titel und Text, Hashtags, Text im Cover, Suche vs. Empfehlung.",
       "status": "ready"
      },
      {
       "skill": "skill-persona-check",
       "label": "Profil-Passung",
       "desc": "Prüft, ob ein Inhalt zum Profil passt (Positionierung, Thema, Format, Zielgruppe, Stil, Tabus), mit Punktzahl und Abweichungen.",
       "status": "ready"
      },
      {
       "skill": "skill-community-ops",
       "label": "Kommentare",
       "desc": "Antwortvorlagen für Kommentare (Lob, Fragen, Kaufinteresse, Trolle), Themen aus Kommentaren und Krisenkommunikation.",
       "status": "ready"
      },
      {
       "skill": "skill-publish-notify",
       "label": "Benachrichtigung",
       "desc": "Schickt Erfolg oder Fehler beim Posten an Slack, Telegram, Teams oder einen beliebigen Webhook.",
       "status": "ready"
      },
      {
       "skill": "skill-publish-log",
       "label": "Veröffentlichungsprotokoll",
       "desc": "Hält jede Veröffentlichung fest (Plattform, Titel, Link, Zeit, erste Zahlen) und beantwortet Fragen dazu.",
       "status": "ready"
      },
      {
       "skill": "skill-content-calendar-log",
       "label": "Kalender-Basis",
       "desc": "Gemeinsame Zeitleiste für Gepostetes, Geplantes und Events, die der Agent vor dem Planen liest.",
       "status": "ready"
      }
     ]
    },
    {
     "id": "data",
     "label": "Daten und Rückblick",
     "items": [
      {
       "skill": "skill-data-tracker",
       "label": "Kennzahlen verfolgen",
       "desc": "Kennzahlen festhalten und Trends analysieren: Tageswerte, Wachstum und Lebenszyklus einzelner Posts.",
       "status": "ready"
      },
      {
       "skill": "skill-post-scorer",
       "label": "Interaktions-Score",
       "desc": "Bewertet Post-Entwürfe nach Interaktionspotenzial mit einer strukturierten Bewertungskarte.",
       "status": "ready"
      },
      {
       "skill": "skill-publish-analytics",
       "label": "Wirkungsanalyse",
       "desc": "Analysiert das Veröffentlichungsprotokoll nach Uhrzeit, Hashtags, Format und Follower-Wachstum und gibt umsetzbare Empfehlungen.",
       "status": "ready"
      },
      {
       "skill": "skill-social-performance-review",
       "label": "Monatsrückblick",
       "desc": "Monatsbericht zur Wirkung der Inhalte je Plattform mit konkreten Empfehlungen für den nächsten Monat.",
       "status": "ready"
      },
      {
       "skill": "skill-strategy-advisor",
       "label": "Strategie weiterentwickeln",
       "desc": "Leitet aus Daten, Profil und Trends die nächste Phase ab: Richtung, neue Themen, Formate, Rhythmus, Profilanpassungen.",
       "status": "ready"
      },
      {
       "skill": "skill-content-postmortem",
       "label": "Viral-Rückblick",
       "desc": "Warum ein Post funktioniert hat oder nicht, und welche Muster sich aus mehreren Posts als Formel ableiten lassen.",
       "status": "ready"
      },
      {
       "skill": "skill-comment-insights",
       "label": "Kommentar-Analyse",
       "desc": "Stimmung (positiv/neutral/negativ), häufige Begriffe, Wünsche, Beschwerden und Fragen aus Kommentaren als Datengrundlage.",
       "status": "ready"
      },
      {
       "skill": "roi-calculator",
       "label": "ROI-Rechner",
       "desc": "Berechnet CTR, CPC, CPM, ROAS aus Kampagnendaten, vergleicht mit Branchenwerten und mehreren Kampagnen.",
       "status": "ready"
      }
     ]
    },
    {
     "id": "account",
     "label": "Konten und Bestand",
     "items": [
      {
       "skill": "skill-my-account",
       "label": "Meine Konten",
       "desc": "Zeigt angemeldete Konten mit Identität, Followern, Likes und Posts (automatisch derzeit nur X).",
       "status": "done"
      },
      {
       "skill": "skill-profile-builder",
       "label": "Profil anlegen",
       "desc": "Ersteinrichtung: erstellt aus Social-Media-Links und Zielen ein Konto-Profil mit 6 Dimensionen.",
       "status": "ready"
      },
      {
       "skill": "skill-profile-manager",
       "label": "Profile verwalten",
       "desc": "Profile anlegen, bearbeiten, Erfahrungen ergänzen, wechseln, exportieren und vergleichen.",
       "status": "ready"
      },
      {
       "skill": "asset-manager",
       "label": "Ergebnisse verwalten",
       "desc": "Ordnet Ergebnisse in outputs/ nach Datum, Plattform und Typ, vergibt Tags, durchsucht frühere Inhalte und erstellt Materiallisten.",
       "status": "ready"
      },
      {
       "skill": "template-library",
       "label": "Vorlagen",
       "desc": "Speichert erfolgreiche Inhaltsstrukturen als Vorlagen zum Wiederverwenden, mit Kategorien und Versionen.",
       "status": "ready"
      },
      {
       "skill": "batch-process",
       "label": "Stapelverarbeitung",
       "desc": "Wendet eine Aktion auf viele Bilder, Videos oder Audios an: komprimieren, Wasserzeichen, Format, Größe, Seitenverhältnis, Lautheit.",
       "status": "ready"
      }
     ]
    }
   ]
  }
 ]
};

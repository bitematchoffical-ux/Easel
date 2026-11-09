# Profil-Vorlage

Dieser Ordner ist die Vorlage für Konto-Profile. Für ein neues Profil den ganzen Ordner `_template/` kopieren,
umbenennen und die Platzhalter ausfüllen (oder geführt mit `skill-profile-builder`).

## Dateien und Ebenen

Postloop arbeitet in Ebenen (Entdecken, Planen, Produzieren, Veröffentlichen, Auswerten). Jede Profildatei spielt
darin eine andere Rolle:

| Datei | Inhalt | Genutzt in |
|------|------|----------|
| `identity.md` | Positionierung, Alleinstellung, Inhaltsrichtung | Entdecken + Planen |
| `style.md` | Ton, Einstieg, Bildsprache, Tempo, Markenzeichen | Produzieren (steuert Ton, Tempo, Optik) |
| `audience.md` | Kernzielgruppe, Interessen, Probleme, Interaktion | Produzieren + Planen |
| `platforms.md` | Konten, Formate, Plattformregeln | nur Veröffentlichen |
| `preferences.md` | Machen, Nicht machen, rechtliche Grenzen | alle Ebenen (harte Regeln) |
| `memory.md` | Erkenntnisse, Fehler, Feedback-Muster | Produzieren + Auswerten |

## Die Dateien im Einzelnen

### identity.md – Wer bin ich

Kernpositionierung und Alleinstellung. Entdecken filtert damit passende Trends, Planen prüft, ob ein Thema passt.
Beim Produzieren wird die Datei nicht direkt genutzt; die Positionierung steckt schon im Thema.

### style.md – Wie wir klingen

Das „Gefühl“ der Inhalte: Ton, Einstieg, Tempo, Bildsprache, Markenzeichen. Beim Produzieren der Stil-Anker für
einheitliche Ergebnisse.

### audience.md – Für wen

Wer zuschaut und was sie brauchen. Steuert Wortwahl, Beispiele und Interaktionsaufrufe.

### platforms.md – Wo

Konten, Formate und Regeln je Plattform. Nur beim Veröffentlichen (Hochformat/Querformat, Zeichenlimits, Hashtags,
KI-Label). Nicht genutzte Plattformen löschen.

### preferences.md – Was geht und was nicht

Harte Regeln, die in allen Ebenen gelten. Die einzige Datei, die überall zwingend geladen wird.

### memory.md – Was wir gelernt haben

Verdichtete Erfahrungen, kein Tagebuch. Nur bei echten, wiederverwendbaren Erkenntnissen aktualisieren.

## Nutzung

```bash
# neues Profil anlegen
cp -r profiles/_template profiles/mein-profil

# Dateien ausfüllen, dann in Postloop nutzen
easel skill <skill_name> -i "Inhalt" -p mein-profil
```

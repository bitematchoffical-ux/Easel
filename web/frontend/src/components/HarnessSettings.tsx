import { useEffect, useRef, useState } from 'react';
import { fetchHarnessModels, fetchHarnessSettings, saveHarnessSettings } from '../lib/api';
import type { HarnessModel, HarnessSettingsResponse } from '../lib/api';
import SettingsSelect from './SettingsSelect';

export default function HarnessSettings({ onChange, onSelect }: {
  onChange: (runtime: string) => void;
  onSelect: (runtime: string) => void;
}) {
  const [settings, setSettings] = useState<HarnessSettingsResponse | null>(null);
  const [runtime, setRuntime] = useState('api');
  const [model, setModel] = useState('');
  const [sandbox, setSandbox] = useState('workspace-write');
  const [autoApprove, setAutoApprove] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [catalogs, setCatalogs] = useState<Record<string, HarnessModel[]>>({});
  const [modelLoading, setModelLoading] = useState(false);
  const [modelNote, setModelNote] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const modelRequest = useRef(0);

  useEffect(() => {
    let alive = true;
    setSettingsLoading(true);
    setNote('');
    fetchHarnessSettings().then((value) => {
      if (!alive) return;
      setSettings(value);
      setRuntime(value.runtime);
      setModel(value.models[value.runtime] || '');
      setSandbox(value.sandbox);
      setAutoApprove(value.codex_auto_approve ?? false);
      onChange(value.runtime);
      onSelect(value.runtime);
    }).catch((error) => {
      if (alive) setNote(`Lesen fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}`);
    }).finally(() => {
      if (alive) setSettingsLoading(false);
    });
    return () => { alive = false; modelRequest.current += 1; };
  }, [onChange, onSelect, refresh]);

  const selected = settings?.agents.find((agent) => agent.id === runtime);
  const nativeModels = catalogs[runtime] || [];
  const pullModels = async () => {
    const requested = runtime;
    const sequence = ++modelRequest.current;
    setModelLoading(true);
    setModelNote('');
    try {
      const result = await fetchHarnessModels(requested);
      if (modelRequest.current !== sequence) return;
      setCatalogs((previous) => ({ ...previous, [requested]: result.models }));
      if (!result.models.length) setModelNote('Das native CLI liefert keine Modelle; Standardmodell nutzen oder selbst eintragen.');
    } catch (error) {
      if (modelRequest.current === sequence) {
        setModelNote(`Lesen fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}`);
      }
    } finally {
      if (modelRequest.current === sequence) setModelLoading(false);
    }
  };
  const save = async () => {
    setBusy(true);
    setNote('');
    try {
      const value = await saveHarnessSettings(runtime, model, sandbox, runtime === 'codex' ? autoApprove : undefined);
      setSettings(value);
      onChange(value.runtime);
      setNote('Gespeichert, bitte einen neuen Chat starten; alte Chats bleiben bei der bisherigen Engine.');
    } catch (error) {
      setNote(`Speichern fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="st-panel active harness-settings" aria-label="Agent-Engine">
      <div className="panel-top">
        <strong>Agent-Engine</strong>
        <span className="desc">Nur Chat oder Agent mit Werkzeugen</span>
        <span className="spacer" />
        <button className="btn btn-sm" disabled={!settings || settingsLoading || busy || settings.locked || !selected?.installed}
          onClick={() => void save()}>{busy ? 'Wird gespeichert …' : 'Engine speichern'}</button>
        <button className="btn btn-sm" disabled={settingsLoading || busy}
          onClick={() => setRefresh((previous) => previous + 1)}>{settingsLoading ? 'Wird gelesen …' : 'Erneut laden'}</button>
      </div>
      <div className="settings-field">
        <span className="settings-field-label">Ausführende Engine</span>
        <div className="settings-field-body">
          <div className="settings-engine-control">
            <SettingsSelect label="Ausführende Engine" value={runtime} disabled={!settings || settingsLoading || busy || settings.locked}
              options={(settings?.agents || [{ id: 'api', label: 'Nur Chat', installed: true }])
                .map((agent) => ({
                value: agent.id,
                label: `${agent.label}${agent.installed ? '' : '(nicht installiert / nicht eingerichtet)'}`,
              }))}
              onChange={(value) => {
                setRuntime(value);
                setModel(settings?.models[value] || '');
                modelRequest.current += 1;
                setModelLoading(false);
                setModelNote('');
                setNote('');
                onSelect(value);
              }} />
            <span className="settings-help">
              <button type="button" className="settings-help-trigger" aria-label="Was der Nur-Chat-Modus kann"
                aria-describedby="chat-only-help">ⓘ</button>
              <span id="chat-only-help" className="settings-help-tooltip" role="tooltip">
                Der Nur-Chat-Modus ruft die Modell-API direkt auf: gut für Fragen, Texte und Analysen. Es startet kein Agent,
                es gibt keinen Zugriff auf lokale Dateien, Befehle, Browser oder Skills. Modell, API-Adresse und Schlüssel unten eintragen;
                für Werkzeuge zu OpenClaw, OpenCode, Codex oder einem anderen Agent wechseln. Danach neuen Chat starten, alte Verläufe bleiben.
              </span>
            </span>
          </div>
          <p className="desc">{runtime === 'api' ? 'Direkte Modell-API · ohne Agent-Installation, Modell unten einrichten'
            : runtime === 'openclaw' ? 'Modell, API-Adresse und Schlüssel für OpenClaw unten eintragen; nach dem Speichern an den Gateway übertragen'
            : `${selected?.protocol || ''} · Verbindung über den Adapter, keine weitere Auswahl nötig`}</p>
          <p className="desc">Bei der Installation kann OpenClaw gewählt oder übersprungen werden; hier lassen sich andere installierte Engines wählen. Die Auswahl zeigt deren Einstellungen; erst „Engine speichern“ wechselt. Anmeldungen bleiben bei der jeweiligen Engine.</p>
          {selected && !selected.installed && (
            <p className="desc" role="status">Nicht gefunden:  {selected.label}. Bitte prüfen, ob das CLI im Benutzerkonto installiert ist, unter dem die Weboberfläche läuft, und ob der PATH beim Start stimmt;
              nach Installation oder Pfadänderung die Weboberfläche neu starten. Bestehende Einstellungen bleiben; vor der Installation kann es nicht als Engine gespeichert werden.</p>
          )}
          {runtime !== settings?.runtime && <p className="desc">Das ist eine Vorschau der Einstellungen; erst „Engine speichern“, dann unten die API-Einstellungen speichern. Alte Chats werden nicht übertragen.</p>}
        </div>
      </div>
      {runtime !== 'openclaw' && runtime !== 'api' && (
        <>
          <div className="settings-field">
            <label className="settings-field-label" htmlFor="harness-model">Modell überschreiben</label>
            <div className="settings-field-body">
              {(runtime === 'codex' || runtime === 'opencode') && (
                <div className="settings-native-models">
                  <SettingsSelect label="Natives Modell" value={model} disabled={busy || settings?.locked}
                    options={[
                      { value: '', label: 'Natives Standardmodell nutzen' },
                      ...nativeModels.map((item) => ({ value: item.id,
                        label: `${item.label}${item.default ? '(nativer Standard)' : ''}` })),
                      ...(model && !nativeModels.some((item) => item.id === model)
                        ? [{ value: model, label: `${model}(aktuell / eigenes)` }] : []),
                    ]} onChange={setModel} />
                  <button className="btn btn-sm" disabled={modelLoading || busy || !selected?.installed}
                    onClick={() => void pullModels()}>{modelLoading ? 'Wird gelesen …' : 'Modelle abrufen'}</button>
                </div>
              )}
              <input id="harness-model" className="mock" value={model} disabled={busy || settings?.locked} maxLength={240}
              onChange={(event) => setModel(event.target.value)}
              placeholder={runtime === 'codex' ? 'Leer lassen = native Codex-Einstellung' : 'provider/model; leer = native Einstellung'} />
              <p className="desc">Aus der Liste des nativen CLI wählen oder selbst eintragen; leer = natives Standardmodell, Anbieter anderer Engines bleiben unverändert.
                Ob das Modell nutzbar ist, hängt von Konto, Anbieter und nativem CLI ab.</p>
              {modelNote && <p className="desc" role="status">{modelNote}</p>}
            </div>
          </div>
          {runtime === 'codex' && (
            <>
            <div className="settings-field">
              <span className="settings-field-label">Codex-Sandbox</span>
              <div className="settings-field-body">
                <SettingsSelect label="Codex-Sandbox" value={sandbox} disabled={busy || settings?.locked}
                  options={[
                    { value: 'workspace-write', label: 'Schreiben im Projektordner' },
                    { value: 'read-only', label: 'Nur lesen' },
                  ]}
                  onChange={setSandbox} />
                <p className="desc">Gewählte Sandbox-Grenze bleibt, kein voller Systemzugriff.</p>
              </div>
            </div>
            <div className="settings-field">
              <label className="settings-field-label" htmlFor="codex-auto-approve">Dauerhaft erlauben</label>
              <div className="settings-field-body">
                <button id="codex-auto-approve" type="button" role="switch"
                  aria-checked={autoApprove} aria-label="Dauerhaft erlauben"
                  aria-describedby="codex-auto-approve-help" className="settings-permission-switch"
                  disabled={busy || settingsLoading || !settings || settings.locked}
                  onClick={() => setAutoApprove((previous) => !previous)}>
                  <span className="settings-permission-switch__thumb" />
                </button>
                <p id="codex-auto-approve-help" className="desc">Gilt nach dem Speichern dauerhaft und nur für Codex in Postloop:
                  Dateien lesen, suchen, Git ansehen/holen und Dateiänderungen im Projektordner werden automatisch erlaubt.
                  sudo, Löschen, Systemänderungen, Skripte und unklare Aktionen bleiben bestätigungspflichtig; keine unbegrenzten Rechte, jederzeit abschaltbar.</p>
              </div>
            </div>
            </>
          )}
          <p className="desc">Die Anmeldung verwaltet das native CLI; Postloop überträgt keine Schlüssel. Nicht automatisch erlaubte Rechte werden im Chat bestätigt;
            OpenCode / allgemeines ACP nutzen ihre eigenen Rechteregeln, nicht die Codex-Sandbox.</p>
          <p className="desc"><code>{selected?.install_hint}</code></p>
          <p className="desc">„Installiert“ heißt nur, dass das CLI gefunden wurde, nicht, dass ein Modell angemeldet ist; nach dem Speichern zum Prüfen eine Nachricht senden.</p>
        </>
      )}
      {settings?.locked && <p className="desc">EASEL_AGENT_RUNTIME ist in der Startumgebung fest gesetzt; zum Ändern die Startumgebung anpassen und neu starten.</p>}
      {note && <div className={`save-note${/失败|fehlgeschlagen/.test(note) ? ' err' : ''}`} role="status">{note}</div>}
    </section>
  );
}

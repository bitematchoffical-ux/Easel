import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { fetchTrendManagement, updateTrendSource } from '../lib/api';
import type { TrendManagedSource } from '../lib/api';
import SettingsSelect from './SettingsSelect';

export default function TrendSourcesDialog({ onClose, onChanged }: { onClose: () => void; onChanged: (addedId?: string) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const errorBox = useRef<HTMLDivElement>(null);
  const alive = useRef(true);
  const [sources, setSources] = useState<TrendManagedSource[]>([]);
  const [template, setTemplate] = useState('');
  const [scriptCode, setScriptCode] = useState('');
  const [scriptName, setScriptName] = useState('collector.py');
  const [maxScriptBytes, setMaxScriptBytes] = useState(65536);
  const fileInput = useRef<HTMLInputElement>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [removing, setRemoving] = useState('');
  const [kind, setKind] = useState('rss');
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [method, setMethod] = useState('GET');
  const [headers, setHeaders] = useState('{}');
  const [body, setBody] = useState('{}');
  const [refresh, setRefresh] = useState(300);

  const reload = useCallback(async () => {
    const result = await fetchTrendManagement();
    if (!alive.current) return;
    setSources(result.sources); setWarnings(result.warnings);
    setTemplate(result.python_template); setMaxScriptBytes(result.script_max_bytes);
    setScriptCode(prev => prev || result.python_template);
  }, []);
  useEffect(() => {
    alive.current = true;
    const element = dialog.current;
    element?.showModal();
    void reload().catch((e: unknown) => {
      if (alive.current) setError(e instanceof Error ? e.message : 'Datenquellen konnten nicht gelesen werden.');
    }).finally(() => { if (alive.current) setLoading(false); });
    return () => { alive.current = false; element?.close(); };
  }, [reload]);
  useEffect(() => { if (error) errorBox.current?.focus(); }, [error]);

  const mutate = async (value: Record<string, unknown>, added = false) => {
    if (busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await updateTrendSource(value);
      onChanged(added ? result.id : undefined);
      if (alive.current) {
        if (added) { setLabel(''); setUrl(''); }
        setRemoving(''); setNotice(added ? 'Hinzugefügt; der Trend-Radar wählt diese Quelle automatisch aus.' : 'Gespeichert.');
        await reload();
      }
    } catch (e: unknown) {
      if (alive.current) setError(e instanceof Error ? e.message : 'Speichern fehlgeschlagen, bitte später erneut versuchen.');
    } finally { if (alive.current) setBusy(false); }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    try {
      const value: Record<string, unknown> = { action: 'add', label: label.trim(), type: kind, refresh_seconds: refresh };
      if (kind === 'python') {
        if (!scriptCode.trim() || new TextEncoder().encode(scriptCode).length > maxScriptBytes) throw new Error('Bitte Abrufcode eintragen; UTF-8-Skripte dürfen höchstens 64 KiB groß sein.');
        value.script_name = scriptName;
        value.script_code = scriptCode;
      }
      else {
        value.url = url.trim();
        const parsed: unknown = JSON.parse(headers);
        if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object' || Object.values(parsed).some(v => typeof v !== 'string')) throw new Error('Header müssen eine JSON-Zuordnung von Strings sein, z. B. {"Authorization":"Bearer ${TOKEN}"}.');
        value.headers = parsed;
        if (kind === 'http') {
          value.method = method;
          if (method === 'POST') value.body = JSON.parse(body);
        }
      }
      void mutate(value, true);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Das JSON in den erweiterten Einstellungen ist ungültig.'); }
  };

  return <dialog ref={dialog} className="trend-manager" aria-labelledby="trend-manager-title" onCancel={event => { event.preventDefault(); onClose(); }}>
    <div className="trend-manager-head"><div><h2 id="trend-manager-title">Datenquellen</h2><p>Abonniere Themen, die dich interessieren, oder binde einen eigenen Abrufdienst an.</p></div><button className="btn btn-sm" onClick={onClose}>Schließen</button></div>
    {error && <div ref={errorBox} tabIndex={-1} className="trend-manager-error" role="alert">{error}</div>}
    {notice && <div className="trend-manager-notice" role="status">{notice}</div>}
    {warnings.map((warning, i) => <p className="trend-manager-error" key={i}>{warning}</p>)}
    {loading ? <p role="status">Datenquellen werden geladen …</p> : <>
      <section className="trend-manager-list" aria-label="Eingerichtete Quellen">
        {sources.map(source => <div key={source.id} className="trend-manager-row">
          <div><strong>{source.label}</strong><span>{source.builtin ? 'Eingebaut' : 'Eigene'} · {source.enabled ? 'Aktiv' : 'Deaktiviert'}</span></div>
          <button className="btn btn-sm" disabled={busy} aria-label={`${source.enabled ? 'Deaktivieren' : 'Aktivieren'}${source.label}`} onClick={() => { void mutate({ action: 'toggle', id: source.id, enabled: !source.enabled }); }}>{source.enabled ? 'Deaktivieren' : 'Aktivieren'}</button>
          {!source.builtin && (removing === source.id ? <><button className="btn btn-sm btn-danger" disabled={busy} onClick={() => { void mutate({ action: 'delete', id: source.id }); }}>Wirklich löschen</button><button className="btn btn-sm" onClick={() => setRemoving('')}>Abbrechen</button></> : <button className="btn btn-sm" disabled={busy} aria-label={`Löschen${source.label}`} onClick={() => setRemoving(source.id)}>Löschen</button>)}
        </div>)}
      </section>
      <form onSubmit={submit} className="trend-manager-form" aria-busy={busy}>
        <h3>Quelle hinzufügen</h3>
        <div className="trend-manager-fields">
          <label>Name<input className="field" required maxLength={80} value={label} onChange={e => setLabel(e.target.value)} placeholder="z. B. Branchennews" /></label>
          <div><span className="field-label">Anbindung</span><SettingsSelect label="Anbindung" value={kind} disabled={busy} options={[{value:'rss',label:'RSS-/Atom-Feed'},{value:'http',label:'HTTP-Schnittstelle'},{value:'python',label:'Python-Skript'}]} onChange={next => { setKind(next); if (next === 'python' && !scriptCode) setScriptCode(template); }} /></div>
        </div>
        {kind === 'python' ? <>
          <div className="trend-script-toolbar"><span>{scriptName}</span><button className="btn btn-sm" type="button" disabled={busy} onClick={() => fileInput.current?.click()}>.py-Datei wählen</button><button className="btn btn-sm" type="button" disabled={busy || !template} onClick={() => { setScriptCode(template); setScriptName('collector.py'); }}>Beispiel wiederherstellen</button></div>
          <input ref={fileInput} type="file" accept=".py" hidden aria-label="Python-Skript wählen" onChange={async event => {
            const file = event.currentTarget.files?.[0]; event.currentTarget.value = '';
            if (!file) return;
            try {
              if (!/\.py$/i.test(file.name) || file.size > maxScriptBytes) throw new Error('Bitte eine UTF-8-.py-Datei mit höchstens 64 KiB wählen.');
              const code = new TextDecoder('utf-8', {fatal:true}).decode(await file.arrayBuffer());
              if (!alive.current) return;
              setScriptCode(code); setScriptName(file.name); setError('');
              setLabel(prev => prev || file.name.replace(/\.py$/i,'').slice(0,80));
            } catch { if (alive.current) setError('Skript nicht lesbar; bitte eine UTF-8-.py-Datei mit höchstens 64 KiB wählen.'); }
          }} />
          <label>Python-Abrufcode<textarea className="field trend-code-editor" aria-label="Python-Abrufcode" required spellCheck={false} rows={12} wrap="off" maxLength={65536} value={scriptCode} onChange={e => setScriptCode(e.target.value)} /></label>
          <p className="trend-manager-hint">Vor dem Speichern wird nur die Syntax in einem abgeschotteten Prozess geprüft; nach Speichern und Aktivieren läuft der Code mit dem Dienstkonto. Unbekannte Skripte besser als isolierten HTTP-Dienst betreiben.</p>
        </> : <label>{kind === 'rss' ? 'Feed-Adresse' : 'Endpunkt-Adresse'}<input className="field" type="url" required maxLength={8192} value={url} onChange={e => setUrl(e.target.value)} placeholder="https://…" /></label>}
        <details><summary>Erweiterte Einstellungen</summary>
          <label>Aktualisierungsintervall (Sekunden)<input className="field" type="number" min={1} max={86400} required value={refresh} onChange={e => setRefresh(Number(e.target.value))} /></label>
          {kind === 'http' && <div><span className="field-label">Methode</span><SettingsSelect label="Methode" value={method} disabled={busy} options={[{value:'GET',label:'GET'},{value:'POST',label:'POST'}]} onChange={setMethod} /></div>}
          {kind !== 'python' && <label>Header (JSON, Umgebungsvariablen erlaubt)<textarea className="field" aria-label="Header" rows={3} maxLength={8192} value={headers} onChange={e => setHeaders(e.target.value)} /></label>}
          {kind === 'http' && method === 'POST' && <label>Body (JSON)<textarea className="field" aria-label="Body" rows={3} maxLength={8192} value={body} onChange={e => setBody(e.target.value)} /></label>}
        </details>
        <div className="trend-manager-footer"><span>Gilt sofort nach dem Speichern.</span><button className="btn btn-primary" type="submit" disabled={busy || (kind === 'python' && !scriptCode.trim())}>{busy ? 'Wird gespeichert …' : kind === 'python' ? 'Speichern und aktivieren' : 'Quelle hinzufügen'}</button></div>
      </form>
    </>}
  </dialog>;
}

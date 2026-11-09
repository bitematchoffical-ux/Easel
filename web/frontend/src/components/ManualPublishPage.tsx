import { useEffect, useRef, useState } from 'react';
import { createSchedule, executeSkill, exportManualPackage, fetchOutputs, mediaUrl, runAgent, streamChat } from '../lib/api';
import type { OutputFile } from '../lib/api';
import { loadPublishDraft, savePublishDraft } from '../lib/store';
import { renderMarkdown } from '../lib/sanitize';
import { IconCalendar, IconCheck, IconCopy, IconEdit, IconPublish, IconSkills, IconStop, IconTrash } from './icons';

// Postloop: Limits und Links müssen zu easel/manual_publish.py passen.
const PLATFORMS = [
  { key: 'instagram', label: 'Instagram', titleLimit: 0, bodyLimit: 2200, url: 'https://www.instagram.com/', hint: 'Kein Titelfeld: Titel und Text werden zur Caption. Mehrere Bilder = Karussell, Video = Reel.' },
  { key: 'tiktok', label: 'TikTok', titleLimit: 0, bodyLimit: 4000, url: 'https://www.tiktok.com/tiktokstudio/upload', hint: 'Video oder Fotos im Hochformat; der Anfang der Beschreibung muss sofort fesseln.' },
  { key: 'youtube-shorts', label: 'YouTube Shorts', titleLimit: 100, bodyLimit: 5000, url: 'https://studio.youtube.com/', hint: 'Braucht ein Hochformat-Video. Titel max. 100 Zeichen.' },
  { key: 'twitter-x', label: 'X', titleLimit: 0, bodyLimit: 280, url: 'https://x.com/compose/post', hint: 'Titel und Text im offiziellen Post-Fenster einfügen, Länge nach der Zählung der Plattform prüfen und selbst posten.' },
];

function sections(text: string): Record<string, string> {
  const parts = text.split(/^\s*={2,}\s*(.+?)\s*={2,}\s*$/m);
  return Object.fromEntries(Array.from({ length: Math.floor((parts.length - 1) / 2) }, (_, i) => [parts[2 * i + 1].trim(), (parts[2 * i + 2] || '').trim()]));
}

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function ManualPublishPage({ persona }: { persona: string }) {
  const initial = useRef(loadPublishDraft()).current;
  const [title, setTitle] = useState(initial.title);
  const [body, setBody] = useState(initial.body);
  const [platforms, setPlatforms] = useState<string[]>(initial.platforms);
  const [overrides, setOverrides] = useState<Record<string, string>>(initial.overrides);
  const [tags, setTags] = useState(initial.tags || '');
  const [mediaFiles, setMediaFiles] = useState<OutputFile[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [reviewed, setReviewed] = useState<Record<string, string>>({});
  const [links, setLinks] = useState<Record<string, string>>({});
  const [recorded, setRecorded] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState('');
  const [toast, setToast] = useState('');
  const [adapting, setAdapting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState('');
  const [exporting, setExporting] = useState('');
  // Pflichtangabe vor jedem Export (KI-Kennzeichnung); null = noch nicht beantwortet
  const [aiGenerated, setAiGenerated] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const ctl = useRef<AbortController | null>(null);

  useEffect(() => { savePublishDraft({ title, body, platforms, overrides, tags }); }, [title, body, platforms, overrides, tags]);
  useEffect(() => () => ctl.current?.abort(), []);
  useEffect(() => {
    fetchOutputs().then((roots) => {
      const files: OutputFile[] = [];
      const walk = (node: OutputFile) => {
        if (node.type === 'file') { if (node.kind === 'image' || node.kind === 'video') files.push(node); }
        else (node.children || []).forEach(walk);
      };
      roots.forEach(walk);
      setMediaFiles(files.sort((a, b) => (b.mtime || 0) - (a.mtime || 0)));
    }).catch(() => setToast('Inhaltsbibliothek gerade nicht lesbar; Texte lassen sich trotzdem bearbeiten und kopieren'));
  }, []);

  const effective = (key: string) => overrides[key] ?? body;
  const snapshot = (key: string) => JSON.stringify([title, effective(key), tags, selectedMedia]);
  const approved = (key: string) => reviewed[key] === snapshot(key) && !adapting;
  const empty = !title.trim() && !body.trim() && !Object.values(overrides).some((text) => text.trim());
  const showToast = (text: string) => { setToast(text); window.setTimeout(() => setToast(''), 4000); };
  const toggle = (key: string) => setPlatforms((prev) => prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]);
  const toggleMedia = (path: string) => setSelectedMedia((prev) => prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]);
  const bodyWithTags = (key: string) => {
    const text = effective(key);
    const extra = tags.split(/[,，]/).map((t) => t.trim().replace(/^#+/, '')).filter((t) => t && !text.includes(`#${t}`));
    return text + (extra.length ? `\n\n${extra.map((t) => `#${t}`).join(' ')}` : '');
  };

  const adapt = () => {
    if (empty || !platforms.length || adapting) return;
    const selected = PLATFORMS.filter((p) => platforms.includes(p.key));
    const prompt = `Nur den folgenden Entwurf umschreiben und formatieren; keine Tools, Veröffentlichungsskripte oder Plattform-Schnittstellen ausführen. An das aktuelle Profil anpassen für: ${selected.map((p) => p.label).join('、')}。\n`
      + 'Fakten beibehalten, keine ungeprüften Zahlen ergänzen. Pro Abschnitt nur den Text liefern, den Titel nicht wiederholen. Für jede Plattform einfügbaren Klartext mit natürlichen Zeilenumbrüchen ausgeben. Kein HTML.\n'
      + 'Streng in folgendem Format antworten, ein Abschnitt pro Plattform, ohne zusätzliche Erklärungen:\n'
      + selected.map((p) => `===${p.label}===\n<formatierter Text>`).join('\n')
      + `\n\nTitel: ${title}\nText: ${body}`;
    let acc = '';
    const base = { ...overrides };
    setAdapting(true);
    ctl.current = streamChat(prompt, persona, `manual-adapt-${Date.now()}`, (chunk) => {
      acc += chunk;
      const parsed = sections(acc);
      const next = { ...base };
      selected.forEach((p) => { if (parsed[p.label] != null) next[p.key] = parsed[p.label]; });
      setOverrides(next);
    }, () => { setAdapting(false); showToast(Object.keys(sections(acc)).length ? 'KI-Formatierung fertig, bitte jede Plattform selbst prüfen' : 'Keine Plattformtexte erkannt, bitte erneut versuchen'); },
    (error) => { setAdapting(false); showToast(error.message || 'Formatierung fehlgeschlagen, bitte erneut versuchen'); });
  };

  const check = async () => {
    if (empty || checking || adapting) return;
    setChecking(true);
    const content = `Titel: ${title}\n${PLATFORMS.filter((p) => platforms.includes(p.key)).map((p) => `${p.label}: ${effective(p.key)}`).join('\n\n')}\nHashtags: ${tags}`;
    try {
      const [general, consistency] = await Promise.all([
        runAgent(`Nur Prüfhinweise geben, nicht posten und keine Veröffentlichungsskripte aufrufen. Faktenbasis, Übertreibungen, Urheberrecht und Stimmigkeit von Titel und Text prüfen und Verbesserungen vorschlagen; Unklares ausdrücklich nennen. Das Prüfergebnis der Plattform kann nicht garantiert werden.\n${content}`),
        persona ? executeSkill('persona-check', content, persona) : Promise.resolve(null),
      ]);
      setCheckResult(general.response + (consistency ? `\n\n## Profil-Passung\n${consistency.response}` : ''));
    } catch (error) { setCheckResult(`Prüfung nicht abgeschlossen: ${error instanceof Error ? error.message : 'Bitte später erneut versuchen'}`); }
    finally { setChecking(false); }
  };

  const copyFor = async (key: string, part: 'title' | 'body' | 'all') => {
    if (!approved(key)) return;
    try {
      await navigator.clipboard.writeText(part === 'title' ? title : part === 'body' ? bodyWithTags(key) : `${title}\n\n${bodyWithTags(key)}`.trim());
      setCopied(`${key}:${part}`);
      window.setTimeout(() => setCopied(''), 1600);
    } catch { showToast('Kopieren hat nicht geklappt; Text bitte manuell markieren oder das Paket exportieren'); }
  };

  const exportFor = async (key: string) => {
    if (!approved(key) || exporting) return;
    if (aiGenerated === null) { showToast('Bitte zuerst angeben, ob KI-generierte Inhalte enthalten sind.'); return; }
    setExporting(key);
    try {
      const result = await exportManualPackage(key, { title, body: effective(key), tags, media: [...selectedMedia], reviewed: true, aiGenerated });
      const a = document.createElement('a');
      a.href = mediaUrl(result.path); a.download = result.filename;
      document.body.appendChild(a); a.click(); a.remove();
      showToast('Paket erstellt und Download gestartet; noch nicht hochgeladen oder gepostet');
    } catch (error) { showToast(error instanceof Error ? error.message : 'Export fehlgeschlagen'); }
    finally { setExporting(''); }
  };

  const addToCalendar = async (key: string, published = false) => {
    if (saving || empty || (published && !approved(key))) return;
    let link = '';
    if (published) {
      try {
        const url = new URL(links[key] || '');
        if (url.protocol !== 'https:') throw new Error();
        link = url.href;
      } catch { showToast('Bitte den HTTPS-Link zum veröffentlichten Beitrag auf der Plattform einfügen'); return; }
    }
    setSaving(true);
    const version = snapshot(key);
    try {
      await createSchedule({ title: title.trim() || effective(key).slice(0, 20), date: today(), time: '',
        platform: PLATFORMS.find((p) => p.key === key)?.label || '', status: published ? 'published' : 'draft',
        note: published ? `[Vom Nutzer als gepostet bestätigt, Plattformstatus nicht automatisch geprüft]\n${link}\n\n${effective(key)}` : effective(key) });
      if (published) setRecorded((prev) => ({ ...prev, [key]: version + (links[key] || '') }));
      showToast(published ? 'Gemäß deiner Bestätigung im Kalender eingetragen; das Ergebnis auf der Plattform wurde nicht automatisch geprüft' : 'Als Entwurf im Kalender gespeichert, wird nicht automatisch gepostet');
    } catch (error) { showToast(error instanceof Error ? error.message : 'Speichern fehlgeschlagen'); }
    finally { setSaving(false); }
  };

  return <div className="publish-page">
    <div className="publish-editor">
      <h1 className="page-title"><IconPublish size={21} /> Veröffentlichen · Export</h1>
      <p className="page-subtitle">KI-Formatierung → selbst prüfen → kopieren / exportieren → auf der offiziellen Seite selbst posten.</p>
      <div className="panel" style={{ marginBottom: 16, fontSize: 13 }}>
        <strong>Das Posten erledigst du.</strong> Diese Seite meldet sich nicht an, lädt nichts hoch und klickt nicht auf Posten. Die Anmeldung auf den Plattformen ist unabhängig von der Kontoseite in Postloop.
      </div>
      <label className="field-label" htmlFor="manual-title">Titel</label>
      <input id="manual-title" className="field" value={title} placeholder="Titel eingeben" onChange={(e) => setTitle(e.target.value)} />
      <label className="field-label" htmlFor="manual-body">Text (Vorlage)</label>
      <textarea id="manual-body" className="field" style={{ minHeight: 180 }} value={body} placeholder="Text eingeben, Plattformen wählen und von der KI formatieren lassen oder selbst bearbeiten." onChange={(e) => setBody(e.target.value)} />
      <label className="field-label" htmlFor="manual-tags">Hashtags (durch Komma getrennt)</label>
      <input id="manual-tags" className="field" value={tags} placeholder="KI,Karriere,Tipps" onChange={(e) => setTags(e.target.value)} />
      <label className="field-label">Zielplattformen</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{PLATFORMS.map((p) => <button key={p.key} className={`chip ${platforms.includes(p.key) ? 'active' : ''}`} onClick={() => toggle(p.key)}>{p.label}</button>)}</div>
      <label className="field-label" style={{ marginTop: 16 }}>Medien · ausgewählt  {selectedMedia.length} </label>
      <p className="pv-hint">Bilder/Videos aus der Inhaltsbibliothek mitexportieren oder später auf der Plattform Dateien vom Rechner wählen.</p>
      <button className="btn btn-sm" onClick={() => setShowPicker((v) => !v)}>{showPicker ? 'Medien einklappen' : 'Medien wählen'}</button>
      {selectedMedia.length > 0 && <ul style={{ fontSize: 12 }}>{selectedMedia.map((path) => <li key={path}><button className="pv-copy" onClick={() => toggleMedia(path)} title="Medium entfernen">×</button> {path.split('/').pop()}</li>)}</ul>}
      {showPicker && <div className="media-grid">
        {!mediaFiles.length && <p className="dash-empty">Noch keine Bilder oder Videos in der Inhaltsbibliothek; Text kann schon exportiert werden.</p>}
        {mediaFiles.slice(0, 80).map((f) => <button type="button" key={f.path} className={`media-cell ${selectedMedia.includes(f.path) ? 'sel' : ''}`} onClick={() => toggleMedia(f.path)} title={f.path}>
          {f.kind === 'image' ? <img src={mediaUrl(f.path)} alt={f.name} loading="lazy" /> : <span className="media-vid">Video · {f.name}</span>}
          {selectedMedia.includes(f.path) && <span className="media-check">✓</span>}
        </button>)}
      </div>}
      <fieldset className="panel" style={{ margin: '16px 0', fontSize: 13 }}>
        <legend className="field-label">KI-Kennzeichnung (Pflicht vor dem Export)</legend>
        <p style={{ margin: '0 0 8px' }}>Enthält der Beitrag KI-generierte oder stark veränderte Bilder, Videos, Stimmen oder Personen?</p>
        <label style={{ marginRight: 16 }}><input type="radio" name="ai-generated" value="yes" aria-label="Ja, KI-generierte Inhalte enthalten" checked={aiGenerated === true} onChange={() => setAiGenerated(true)} /> Ja – Kennzeichnungsschritte und Hinweistext ins Paket</label>
        <label><input type="radio" name="ai-generated" value="no" aria-label="Nein, keine KI-generierten Inhalte" checked={aiGenerated === false} onChange={() => setAiGenerated(false)} /> Nein</label>
      </fieldset>
      <div className="publish-actions">
        {adapting ? <button className="btn btn-sm" onClick={() => { ctl.current?.abort(); setAdapting(false); }}><IconStop size={13} /> Formatierung stoppen</button>
          : <button className="btn btn-sm btn-primary" disabled={empty || !platforms.length} onClick={adapt}><IconSkills size={14} /> KI formatieren / anpassen</button>}
        <button className="btn btn-sm" disabled={empty || checking || adapting} onClick={check}><IconCheck size={14} />{checking ? 'Wird geprüft …' : 'KI-Prüfung'}</button>
        <button className="btn btn-sm" disabled={empty || saving || adapting} onClick={() => addToCalendar(platforms[0] || 'instagram')}><IconCalendar size={14} /> Als Entwurf speichern und einplanen</button>
        <button className="btn btn-sm btn-ghost" disabled={empty || adapting} onClick={() => { setTitle(''); setBody(''); setTags(''); setOverrides({}); setReviewed({}); setCheckResult(''); }}><IconTrash size={13} /> Text leeren</button>
      </div>
      <p className="publish-saved-note">Texte werden automatisch im Browser gespeichert. Die Prüfung gilt nur für die aktuelle Version; nach Änderungen an Titel, Text, Hashtags oder Medien erneut prüfen. Die KI-Prüfung ist nur ein Hinweis.</p>
      {checkResult && <div className="panel"><div className="panel-title">KI-Prüfung</div><div className="skill-body-md" dangerouslySetInnerHTML={{ __html: renderMarkdown(checkResult) }} /></div>}
    </div>
    <div className="publish-previews">
      {!platforms.length && <div className="dash-empty">Zielplattform wählen, um hier Vorschau und Prüfung zu sehen.</div>}
      {PLATFORMS.filter((p) => platforms.includes(p.key)).map((p) => {
        const text = effective(p.key);
        const ready = approved(p.key) && !!(title.trim() || text.trim());
        const isEdit = editing === p.key;
        const hasRecorded = recorded[p.key] === snapshot(p.key) + (links[p.key] || '');
        return <div key={p.key} className={`card pv-card pv-${p.key}`}>
          <div className="pv-head"><span className="pv-plat">{p.label}<span className={`pv-badge ${ready ? 'pv-badge-ok' : ''}`}>{ready ? 'Geprüft' : 'Noch nicht geprüft'}</span></span><span className={`pv-count ${text.length > p.bodyLimit ? 'over' : ''}`}>{text.length} Zeichen</span></div>
          <div className="pv-body">
            <div className={`pv-title ${p.titleLimit && title.length > p.titleLimit ? 'over' : ''}`}>{title || <span className="pv-ph">Titelvorschau</span>}</div>
            {isEdit ? <textarea className="field" aria-label={`${p.label}Text`} style={{ minHeight: 140 }} value={text} onChange={(e) => setOverrides((old) => ({ ...old, [p.key]: e.target.value }))} />
              : <div className="pv-text">{text || 'Textvorschau'}</div>}
            <p className="pv-hint" style={{ marginTop: 12 }}>{p.hint} Zeichenzahl und Format gelten wie auf der Plattform angezeigt.</p>
            <button className="pv-copy" onClick={() => setEditing(isEdit ? null : p.key)}><IconEdit size={13} />{isEdit ? 'Bearbeitung beenden' : 'Version für diese Plattform bearbeiten'}</button>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, margin: '16px 0', fontSize: 13 }}>
              <input type="checkbox" aria-label={`${p.label}Selbst geprüft`} disabled={adapting || isEdit || !(title.trim() || text.trim())} checked={ready} onChange={(e) => setReviewed((old) => ({ ...old, [p.key]: e.target.checked ? snapshot(p.key) : '' }))} />
              Ich habe Fakten, Titel, Text, Hashtags, Medien und Nutzungsrechte dieser Version geprüft und poste sie auf der offiziellen Seite.
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(['title', 'body', 'all'] as const).map((part) => <button key={part} className="btn btn-sm" disabled={!ready} onClick={() => copyFor(p.key, part)}><IconCopy size={13} />{copied === `${p.key}:${part}` ? 'Kopiert' : part === 'title' ? 'Titel kopieren' : part === 'body' ? 'Text kopieren' : 'Alles kopieren'}</button>)}
              <button className="btn btn-sm" disabled={!ready || !!exporting || aiGenerated === null} title={aiGenerated === null ? 'Erst die KI-Frage beantworten' : undefined} onClick={() => exportFor(p.key)}>{exporting === p.key ? 'Wird gepackt …' : 'Text und Medien als ZIP exportieren'}</button>
              {ready ? <a className="btn btn-sm btn-primary" href={p.url} target="_blank" rel="noopener noreferrer">Offizielle Seite öffnen ↗</a> : <button className="btn btn-sm" disabled>Nach Prüfung offizielle Seite öffnen</button>}
            </div>
            <p className="pv-hint" style={{ margin: '14px 0' }}>Exportiert heißt nicht gepostet. ZIP entpacken, auf der offiziellen Seite Text einfügen, Medien hochladen, Vorschau prüfen, KI-Inhalte kennzeichnen und selbst auf Posten klicken.</p>
            <details><summary style={{ cursor: 'pointer', fontSize: 13 }}>Nach dem Posten: Link eintragen</summary>
              <input className="field" aria-label={`${p.label}Link zum Beitrag`} placeholder="https://-Link zum veröffentlichten Beitrag einfügen" value={links[p.key] || ''} onChange={(e) => setLinks((old) => ({ ...old, [p.key]: e.target.value }))} style={{ margin: '10px 0' }} />
              <button className="btn btn-sm" disabled={!ready || saving || !links[p.key]?.trim() || hasRecorded} onClick={() => addToCalendar(p.key, true)}>{hasRecorded ? 'Bestätigung gespeichert' : 'Ich habe auf der Plattform gepostet, im Kalender eintragen'}</button>
              <p className="pv-hint">Wird gemäß deiner Bestätigung gespeichert; der Plattformstatus wird nicht automatisch geprüft.</p>
            </details>
          </div>
        </div>;
      })}
    </div>
    {toast && <div className="toast" role="status">{toast}</div>}
  </div>;
}

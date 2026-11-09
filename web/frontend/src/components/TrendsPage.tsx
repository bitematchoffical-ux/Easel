import { Component, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { fetchTrendSources, fetchTrends, createIdea } from '../lib/api';
import type { TrendGroup, TrendSource } from '../lib/api';
import { IconFire, IconRefresh, IconBookmark, IconCheck } from './icons';
import TrendSourcesDialog from './TrendSourcesDialog';

interface TrendsPageProps {
  onUseTopic: (title: string) => void;   // 一键做成内容 → 跳 chat
}

class TrendBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <div className="page-scroll trends-page"><div className="notice-error" role="alert">Die Trend-Seite kann gerade nicht angezeigt werden; der Rest des Arbeitsbereichs funktioniert.<button className="btn btn-sm" onClick={() => this.setState({ failed: false })}>Trends neu laden</button></div></div> : this.props.children;
  }
}

export default function TrendsPage(props: TrendsPageProps) {
  return <TrendBoundary><TrendsPanel {...props} /></TrendBoundary>;
}

function TrendsPanel({ onUseTopic }: TrendsPageProps) {
  const [sources, setSources] = useState<TrendSource[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [groups, setGroups] = useState<TrendGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [updated, setUpdated] = useState(0);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [managerOpen, setManagerOpen] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [saveError, setSaveError] = useState('');
  const requestId = useRef(0);
  const discoveryId = useRef(0);
  const initialized = useRef(false);

  const save = async (key: string, title: string, source: string) => {
    if (saved.has(key)) return;
    try {
      await createIdea({ title, source, status: 'pending' });
      setSaved((prev) => new Set(prev).add(key));
    } catch { setSaveError('Merken fehlgeschlagen, bitte später erneut versuchen.'); }
  };

  const load = useCallback((pfs: string[]) => {
    const id = ++requestId.current;
    if (pfs.length === 0) { setGroups([]); setLoading(false); setError(''); return; }
    setGroups((prev) => prev.filter((g) => pfs.includes(g.platform)));
    setLoading(true);
    setError('');
    fetchTrends(pfs.join(','), 15)
      .then((d) => { if (requestId.current === id) { setGroups(d.trends); setUpdated(d.updated); setWarnings(d.warnings); } })
      .catch((e: unknown) => {
        if (requestId.current === id) setError(e instanceof Error ? e.message : 'Trends konnten nicht geladen werden, bitte später erneut versuchen.');
      })
      .finally(() => { if (requestId.current === id) setLoading(false); });
  }, []);

  const discover = useCallback(() => {
    const id = ++discoveryId.current;
    requestId.current++;
    setReady(false);
    setLoading(false);
    setError('');
    return fetchTrendSources().then((d) => {
      if (discoveryId.current !== id) return;
      setSources(d.sources);
      setWarnings(d.warnings);
      const first = !initialized.current;
      initialized.current = true;
      setSelected((prev) => first ? d.sources.filter((s) => s.default).map((s) => s.id)
        : d.sources.filter((s) => prev.includes(s.id)).map((s) => s.id));
      setGroups((prev) => prev.filter((g) => d.sources.some((s) => s.id === g.platform)));
      setReady(true);
    }).catch((e: unknown) => {
      if (discoveryId.current === id) {
        setGroups([]);
        setSources([]);
        setError(e instanceof Error ? e.message : 'Trend-Quellen konnten nicht geladen werden.');
      }
    });
  }, []);

  const invalidate = useCallback(() => { requestId.current++; discoveryId.current++; }, []);
  useEffect(() => { void discover(); return invalidate; }, [discover, invalidate]);
  useEffect(() => { if (ready) load(selected); }, [load, selected, ready]);
  useEffect(() => {
    if (!groups.some(group => group.error?.code === 'busy')) return;
    const timer = window.setTimeout(() => load(selected), 1500);
    return () => window.clearTimeout(timer);
  }, [groups, selected, load]);

  const toggle = (k: string) =>
    setSelected((prev) => prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]);

  return (
    <div className="page-scroll trends-page" aria-busy={loading}>
      <div className="page-head">
        <div>
          <h1 className="page-title"><IconFire size={22} /> Trend-Radar</h1>
          <p className="page-subtitle">
            Trends und eigene Datenquellen an einem Ort: Thema auswählen und mit einem Klick von der KI in deinen Inhalt verwandeln lassen.
            {updated > 0 && <span style={{ color: 'var(--text-tertiary)' }}> · {new Date(updated * 1000).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} Suchen</span>}
          </p>
        </div>
        <div className="trend-actions"><button className="btn btn-sm" onClick={() => setManagerOpen(true)}>Datenquellen</button>
        <button className="btn btn-sm" onClick={() => { void discover(); }} disabled={loading}>
          <IconRefresh size={14} /> {loading ? 'Wird aktualisiert …' : 'Aktualisieren'}
        </button></div>
      </div>

      <div className="trend-platforms">
        {sources.map((p) => (
          <button key={p.id} className={`chip ${selected.includes(p.id) ? 'active' : ''}`}
            aria-pressed={selected.includes(p.id)} onClick={() => toggle(p.id)}>{p.label}</button>
        ))}
      </div>

      {error && <div className="notice-error" role="alert">{error}</div>}
      {saveError && <div className="notice-error" role="alert">{saveError}</div>}
      {warnings.map((warning, i) => <div className="notice-error" role="status" key={i}>{warning}</div>)}
      {!ready && !error && <div className="trend-platforms" role="status">Datenquellen werden geladen …</div>}
      {ready && sources.length === 0 && <div className="trend-platforms">Noch keine Datenquelle aktiv; bitte in der lokalen Trend-Konfiguration hinzufügen oder aktivieren.</div>}
      {ready && sources.length > 0 && selected.length === 0 && <div className="trend-platforms">Oben eine Datenquelle wählen, um Trends zu sehen.</div>}
      {loading && <div className="trend-platforms" role="status">Trends werden geladen …</div>}

      <div className="trend-grid">
        {groups.map((g) => (
          <div key={g.platform} className="card trend-col">
            <div className="trend-col-head">{g.label}<span className="trend-count">{g.items.length}</span></div>
            <div className="trend-source-status">
              {g.fetched_at && <span>Abgerufen am {new Date(g.fetched_at).toLocaleString('zh-CN')}</span>}
              {g.stale && <span> · Cache abgelaufen</span>}
              {g.error && <div role="status">{g.error.message}{g.stale ? ', vorerst letztes Ergebnis' : ''}</div>}
            </div>
            <div className="trend-list">
              {g.items.length === 0 && !loading && (
                <div className="trend-empty">
                  {!g.ok ? 'Diese Datenquelle ist gerade nicht verfügbar' : 'Abruf erfolgreich, aber keine Trends'}
                </div>
              )}
              {g.items.map((it, i) => (
                <div key={it.id} className="trend-item">
                  <span className={`trend-rank ${i < 3 ? 'top' : ''}`}>{i + 1}</span>
                  <div className="trend-main">
                    <a className="trend-title" href={it.url || undefined} target="_blank" rel="noreferrer"
                      title={it.title}>{it.title}</a>
                    {it.hot && <span className="trend-hot">{it.hot}</span>}
                  </div>
                  <button className="trend-save" title={saved.has(`${g.platform}:${it.id}`) ? 'Im Ideenpool gemerkt' : 'Im Ideenpool merken'}
                    aria-label={`Thema merken: ${it.title}`}
                    onClick={() => save(`${g.platform}:${it.id}`, it.title, g.label)}>
                    {saved.has(`${g.platform}:${it.id}`) ? <IconCheck size={14} /> : <IconBookmark size={14} />}
                  </button>
                  <button className="trend-use" title="Zu Inhalt machen"
                    onClick={() => onUseTopic(it.title)}>Inhalt machen</button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {managerOpen && <TrendSourcesDialog onClose={() => setManagerOpen(false)} onChanged={addedId => {
        void discover().then(() => { if (addedId) setSelected(prev => [...new Set([...prev, addedId])]); });
      }} />}
    </div>
  );
}

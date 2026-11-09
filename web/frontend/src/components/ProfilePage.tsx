import { useState, useEffect } from 'react';
import { fetchPersonas, fetchPersonaFiles, savePersonaFile, deletePersona, fetchAccountAnalytics } from '../lib/api';
import type { PersonaItem, PersonaFile, AccountAnalytics } from '../lib/api';
import { renderMarkdown } from '../lib/sanitize';
import { IconProfile, IconPlus } from './icons';

// 粉丝量级：把粉丝数映射成人话档位（画像里“粉丝量级”一栏要的是量级而非精确值）
function fanTier(n: number): string {
  if (n <= 0) return 'Neues Konto / 0';
  if (n < 500) return 'Start <500';
  if (n < 1000) return 'Einige Hundert';
  if (n < 5000) return 'Tausend+';
  if (n < 10000) return 'Mehrere Tausend';
  if (n < 100000) return '10.000+';
  if (n < 1000000) return '100.000+';
  return '1 Mio.+';
}

// 用注释围栏包住自动抓取段，重复抓取只替换该段、不动用户手写内容（幂等）
const WX_START = '<!-- wechat-oa:auto:start -->';
const WX_END = '<!-- wechat-oa:auto:end -->';

function buildWechatBlock(a: AccountAnalytics): string {
  const fans = a.followers ?? 0;
  const posts = a.posts ?? 0;
  const reads = a.likes ?? 0;
  const tops = [...new Set(a.notes.map((n) => n.title).filter(Boolean))].slice(0, 3);
  const stamp = new Date().toLocaleString('zh-CN', { hour12: false });
  const lines = [
    `### WeChat-Konto (automatisch abgerufen · ${stamp})`,
    '',
    `- **Follower**: ${fans} (${fanTier(fans)})`,
    `- **Format**: Artikel; veröffentlicht ${posts} Beiträge${reads ? `, Aufrufe gesamt ${reads}` : ''}`,
  ];
  if (a.metrics?.length) {
    lines.push(`- **Backend-Daten**: ${a.metrics.map((m) => `${m.label} ${m.value}`).join(' · ')}`);
  }
  if (tops.length) lines.push(`- **Beispielinhalte**: ${tops.join('｜')}`);
  return lines.join('\n');
}

function mergeWechatBlock(existing: string, block: string): string {
  const wrapped = `${WX_START}\n${block}\n${WX_END}`;
  const s = existing.indexOf(WX_START);
  const e = existing.indexOf(WX_END);
  if (s !== -1 && e !== -1 && e > s) {
    return existing.slice(0, s) + wrapped + existing.slice(e + WX_END.length);
  }
  const head = existing.replace(/\s+$/, '');
  return head ? `${head}\n\n${wrapped}` : wrapped;
}

interface ProfilePageProps {
  persona: string;
  onUsePersona: (name: string) => void;
  onNewProfile: () => void;
  onDeleted: (name: string) => void;
}

const DIM_META: Record<string, { label: string; icon: string }> = {
  'identity.md': { label: 'Identität und Positionierung', icon: '🪪' },
  'style.md': { label: 'Stil', icon: '🎨' },
  'audience.md': { label: 'Zielgruppe', icon: '👥' },
  'platforms.md': { label: 'Plattformen', icon: '📱' },
  'preferences.md': { label: 'Vorlieben und Tabus', icon: '⚖️' },
  'memory.md': { label: 'Erfahrungen', icon: '🧠' },
};

export default function ProfilePage(props: ProfilePageProps) {
  const [viewedPersona, setViewedPersona] = useState(props.persona);
  const [personas, setPersonas] = useState<PersonaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);

  useEffect(() => { setViewedPersona(props.persona); }, [props.persona]);
  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError('');
    fetchPersonas().then((list) => {
      if (!ignore) setPersonas(list);
    }).catch(() => {
      if (!ignore) setError('Profile konnten nicht geladen werden, bitte erneut versuchen.');
    }).finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [revision]);

  if (viewedPersona) {
    return <ProfileDetail key={viewedPersona} {...props} persona={viewedPersona}
      inUse={viewedPersona === props.persona}
      onBack={() => { setViewedPersona(''); setRevision((n) => n + 1); }}
      onDeleted={(name) => {
        setPersonas((list) => list.filter((p) => p.name !== name));
        setViewedPersona('');
        setRevision((n) => n + 1);
        props.onDeleted(name);
      }} />;
  }

  return (
    <div className="profile-page">
      <div className="profile-head">
        <div>
          <h1 className="page-title">Konto-Profile <span className="profile-title-en">Profile</span></h1>
          <p className="page-subtitle">Verwalte Positionierung, Stil und Zielgruppe und finde für jedes Projekt die passende Identität.</p>
        </div>
        <button className="btn btn-primary" onClick={props.onNewProfile}><IconPlus size={15} /> Neues Profil</button>
      </div>
      <div className="profile-mode-note">
        <IconProfile size={18} />
        <span>{props.persona ? `Dieser Chat nutzt „${props.persona}“` : 'Dieser Chat läuft im allgemeinen Modus'}<small>Ansehen und Bearbeiten wechselt nicht das Profil des Chats.</small></span>
      </div>
      {loading ? <div className="loading"><div className="spinner" />Profile werden geladen …</div>
        : error ? <div className="empty-state"><p role="alert">{error}</p><button className="btn" onClick={() => setRevision((n) => n + 1)}>Neu laden</button></div>
        : personas.length === 0 ? <div className="empty-state profile-empty">
          <div className="profile-avatar"><IconProfile size={28} /></div>
          <h3>Erstes Profil anlegen</h3>
          <p>Halte Positionierung, Stil und Vorlieben fest, damit jeder Inhalt besser zu dir passt.</p>
          <button className="btn btn-primary" onClick={props.onNewProfile}><IconPlus size={15} /> Neues Profil</button>
        </div> : <>
          <div className="section-title">Meine Profile · {personas.length}</div>
          <div className="profile-grid">
            {personas.map((p) => <article className="card profile-summary" key={p.name}>
              <div className="profile-summary-head">
                <div className="profile-avatar"><IconProfile size={22} /></div>
                {p.name === props.persona && <span className="badge badge-accent">Aktiv</span>}
              </div>
              <h2>{p.name}</h2>
              <p className="profile-summary-description">{p.description || 'Noch keine Kurzbeschreibung. Öffne das Profil und ergänze deine Ausrichtung.'}</p>
              <div className="profile-summary-actions">
                <button className="btn" onClick={() => setViewedPersona(p.name)}>Ansehen / Bearbeiten</button>
                <button className="btn btn-primary" onClick={() => props.onUsePersona(p.name)}>Profil wechseln</button>
              </div>
            </article>)}
          </div>
        </>}
    </div>
  );
}

function ProfileDetail({ persona, onDeleted, onBack, onUsePersona, inUse }: ProfilePageProps & {
  onBack: () => void;
  inUse: boolean;
}) {
  const [files, setFiles] = useState<PersonaFile[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savingFile, setSavingFile] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState('');
  const [fetchingWx, setFetchingWx] = useState(false);

  useEffect(() => {
    if (!persona) { setFiles([]); return; }
    let ignore = false;   // 切 persona 丢弃旧请求（F2）
    setLoading(true);
    setError('');
    setEditing(false);
    fetchPersonaFiles(persona)
      .then((d) => {
        if (ignore) return;
        setFiles(d.files);
        setDrafts(Object.fromEntries(d.files.map((f) => [f.filename, f.content])));
      })
      .catch(() => { if (!ignore) setError('Profil konnte nicht geladen werden'); })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [persona]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const handleSave = async (filename: string) => {
    setSavingFile(filename);
    try {
      await savePersonaFile(persona, filename, drafts[filename] ?? '');
      setFiles((prev) => prev.map((f) => f.filename === filename ? { ...f, content: drafts[filename] ?? '' } : f));
      showToast(`Gespeichert ${DIM_META[filename]?.label || filename} ✓`);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Speichern fehlgeschlagen');
    } finally {
      setSavingFile('');
    }
  };

  // 「平台运营」一键抓取公众号数据：复用数据中心同一个 mp 后台会话接口，把粉丝量级/内容形式
  // 抓完“直接落盘”并刷新视图——不进编辑态、不用用户点保存（否则会露出原始 markdown 破坏观感）。
  const handleFetchWechat = async (filename: string) => {
    setFetchingWx(true);
    try {
      const a = await fetchAccountAnalytics('wechat-oa');
      if (!a.loggedIn) {
        showToast('WeChat-Backend nicht angemeldet: bitte zuerst auf der Seite „Konten“ anmelden');
        return;
      }
      const base = files.find((f) => f.filename === filename)?.content ?? '';
      const merged = mergeWechatBlock(base, buildWechatBlock(a));
      await savePersonaFile(persona, filename, merged);
      // 同步更新 files（视图）与 drafts（若正在编辑也一致），无需手动保存
      setFiles((prev) => prev.map((f) => f.filename === filename ? { ...f, content: merged } : f));
      setDrafts((p) => ({ ...p, [filename]: merged }));
      showToast(`Abgerufen und Profil aktualisiert (Follower ${a.followers ?? 0}, veröffentlicht ${a.posts ?? 0} Beiträge) ✓`);
    } catch (e) {
      showToast(e instanceof Error ? `Abruf fehlgeschlagen: ${e.message}` : 'Abruf fehlgeschlagen (evtl. nicht angemeldet oder Plattform geändert)');
    } finally {
      setFetchingWx(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Profil „${persona}“ wirklich löschen?\nDas kann nicht rückgängig gemacht werden; alle sechs Profildateien werden gelöscht.`)) return;
    setDeleting(true);
    try {
      await deletePersona(persona);
      onDeleted(persona);
      showToast(`Profil gelöscht: „${persona}“`);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Löschen fehlgeschlagen');
    } finally {
      setDeleting(false);
    }
  };


  return (
    <div className="profile-page">
      <div className="profile-detail-nav">
        <button className="btn btn-sm" disabled={!!savingFile || fetchingWx || deleting} onClick={() => {
          if (files.some((f) => (drafts[f.filename] ?? '') !== f.content)
              && !window.confirm('Es gibt ungespeicherte Änderungen. Wirklich zur Profilliste zurück?')) return;
          onBack();
        }}>← Alle Profile</button>
        {inUse ? <span className="badge badge-accent">Wird in diesem Chat genutzt</span>
          : <button className="btn btn-sm" onClick={() => onUsePersona(persona)}>Profil wechseln</button>}
      </div>
      <div className="profile-head">
        <div>
          <h1 className="page-title">{persona}</h1>
          <p className="page-subtitle">Sechs Dimensionen ergeben eine vollständige Persona und lassen sich jederzeit bearbeiten.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={`btn ${editing ? 'btn-primary' : ''}`} onClick={() => setEditing((v) => !v)}>
            {editing ? 'Bearbeitung beenden' : '✏️ Bearbeiten'}
          </button>
          <button className="btn" style={{ color: 'var(--red)', borderColor: 'var(--red)' }}
            disabled={deleting} onClick={handleDelete}>
            {deleting ? 'Wird gelöscht …' : '🗑 Profil löschen'}
          </button>
        </div>
      </div>

      {error && <div style={{ color: 'var(--red)', fontSize: 14, marginTop: 12 }}>{error}</div>}

      {loading ? (
        <div className="loading"><div className="spinner" />Wird geladen …</div>
      ) : (
        files.map((f) => {
          const meta = DIM_META[f.filename] || { label: f.filename, icon: '📄' };
          const dirty = editing && (drafts[f.filename] ?? '') !== f.content;
          return (
            <div key={f.filename} className="profile-dim">
              <div className="profile-dim-head">
                <div className="profile-dim-title">{meta.icon} {meta.label}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {f.filename === 'platforms.md' && (
                    <button className="btn btn-sm" disabled={fetchingWx}
                      title="Follower- und Inhaltsdaten über die angemeldete WeChat-Sitzung abrufen und hier eintragen"
                      onClick={() => handleFetchWechat(f.filename)}>
                      {fetchingWx ? 'Wird abgerufen …' : '📊 WeChat-Daten abrufen'}
                    </button>
                  )}
                  {editing && (
                    <button className="btn btn-sm btn-primary" disabled={!dirty || savingFile === f.filename}
                      onClick={() => handleSave(f.filename)}>
                      {savingFile === f.filename ? 'Wird gespeichert …' : dirty ? 'Speichern' : 'Gespeichert'}
                    </button>
                  )}
                </div>
              </div>
              {editing ? (
                <textarea
                  className="field"
                  style={{ minHeight: 150, fontFamily: "'SF Mono','Consolas',monospace", fontSize: 13 }}
                  value={drafts[f.filename] ?? ''}
                  onChange={(e) => setDrafts((p) => ({ ...p, [f.filename]: e.target.value }))}
                />
              ) : (
                <div className="card" style={{ padding: '14px 18px' }}>
                  <div className="profile-content"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(f.content || '_(leer)_') }} />
                </div>
              )}
            </div>
          );
        })
      )}

      {toast && <div className="toast ok"><span className="toast-icon">✓</span>{toast}</div>}
    </div>
  );
}

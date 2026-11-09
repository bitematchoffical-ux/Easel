import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchIdeas, createIdea, updateIdea, deleteIdea, createSchedule } from '../lib/api';
import type { Idea, IdeaInput } from '../lib/api';
import { IconIdea, IconEdit, IconTrash, IconChat, IconCalendar, IconChevron } from './icons';

interface IdeasPageProps {
  onUseTopic: (title: string) => void;
}

const COLUMNS: { key: string; label: string; color: string }[] = [
  { key: 'pending', label: 'Offen', color: 'var(--text-tertiary)' },
  { key: 'doing', label: 'In Arbeit', color: 'var(--layer-attribute)' },
  { key: 'done', label: 'Erledigt', color: 'var(--layer-publish)' },
];
const NEXT: Record<string, string> = { pending: 'doing', doing: 'done', done: 'pending' };
const EMPTY: IdeaInput = { title: '', note: '', source: '', status: 'pending' };

export default function IdeasPage({ onUseTopic }: IdeasPageProps) {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [form, setForm] = useState<IdeaInput | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const load = useCallback(() => { fetchIdeas().then(setIdeas).catch(() => {}); }, []);
  useEffect(() => { load(); }, [load]);

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2200); };
  const byStatus = useMemo(() => {
    const g: Record<string, Idea[]> = { pending: [], doing: [], done: [] };
    for (const it of ideas) (g[it.status] || g.pending).push(it);
    return g;
  }, [ideas]);

  const openNew = () => { setEditId(null); setForm({ ...EMPTY }); };
  const openEdit = (it: Idea) => { setEditId(it.id); setForm({ title: it.title, note: it.note, source: it.source, status: it.status }); };
  const save = async () => {
    if (!form || !form.title.trim()) return;
    if (editId) await updateIdea(editId, form); else await createIdea(form);
    setForm(null); setEditId(null); load();
  };
  const advance = async (it: Idea) => { await updateIdea(it.id, { ...it, status: NEXT[it.status] }); load(); };
  const remove = async (it: Idea) => { await deleteIdea(it.id); load(); };
  const schedule = async (it: Idea) => {
    // 用本地日期（日历页按本地渲染）：toISOString 是 UTC，东八区 0-8 点会落到「昨天」
    const d = new Date();
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    await createSchedule({ title: it.title, date, platform: '', time: '', status: 'idea', note: it.note });
    showToast('In den Kalender eingetragen (heute)');
  };

  return (
    <div className="page-scroll ideas-page">
      <div className="page-head">
        <div>
          <h1 className="page-title"><IconIdea size={21} /> Ideenpool</h1>
          <p className="page-subtitle">Jede Idee festhalten: aus Trends merken oder selbst anlegen, bis „Inhalt machen“ bringen und dann einplanen.</p>
        </div>
        <button className="btn btn-sm btn-primary" onClick={openNew}>+ Neue Idee</button>
      </div>

      <div className="kanban">
        {COLUMNS.map((col) => (
          <div key={col.key} className="kanban-col">
            <div className="kanban-col-head">
              <span className="kanban-dot" style={{ background: col.color }} />
              {col.label}<span className="kanban-count">{byStatus[col.key].length}</span>
            </div>
            <div className="kanban-list">
              {byStatus[col.key].length === 0 && <div className="kanban-empty">Zieh ein paar Ideen hier rein</div>}
              {byStatus[col.key].map((it) => (
                <div key={it.id} className="card idea-card">
                  <div className="idea-card-actions">
                    <button className="session-act" title="Bearbeiten" onClick={() => openEdit(it)}><IconEdit size={13} /></button>
                    <button className="session-act danger" title="Löschen" onClick={() => remove(it)}><IconTrash size={13} /></button>
                  </div>
                  <div className="idea-title">{it.title}</div>
                  {it.source && <span className="badge" style={{ marginTop: 6 }}>{it.source}</span>}
                  {it.note && <div className="idea-note">{it.note}</div>}
                  <div className="idea-foot">
                    <button className="idea-act" onClick={() => onUseTopic(it.title)}><IconChat size={13} /> Inhalt machen</button>
                    <button className="idea-act" onClick={() => schedule(it)}><IconCalendar size={13} /> Planung</button>
                    <button className="idea-act next" onClick={() => advance(it)} title="Status weiterschalten">
                      {COLUMNS.find((c) => c.key === NEXT[it.status])?.label} <IconChevron size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {form && (
        <div className="overlay" onClick={() => setForm(null)}>
          <div className="modal" style={{ width: 440, maxWidth: '100%' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <h3 style={{ margin: 0 }}>{editId ? 'Idee bearbeiten' : 'Neue Idee'}</h3>
              <button className="icon-btn" onClick={() => setForm(null)}>×</button>
            </div>
            <label className="field-label">Idee *</label>
            <input className="field" value={form.title} autoFocus placeholder="Inhalt / Blickwinkel"
              onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <label className="field-label">Notiz / Blickwinkel</label>
            <textarea className="field" style={{ minHeight: 70 }} value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })} />
            <label className="field-label">Quelle</label>
            <input className="field" value={form.source} placeholder="z. B. TikTok-Trend / eigene Idee"
              onChange={(e) => setForm({ ...form, source: e.target.value })} />
            <label className="field-label">Status</label>
            <div style={{ display: 'flex', gap: 7 }}>
              {COLUMNS.map((c) => (
                <button key={c.key} className={`chip ${form.status === c.key ? 'active' : ''}`}
                  onClick={() => setForm({ ...form, status: c.key })}>{c.label}</button>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
              <button className="btn btn-sm" onClick={() => setForm(null)}>Abbrechen</button>
              <button className="btn btn-sm btn-primary" onClick={save} disabled={!form.title.trim()}>Speichern</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast ok"><span className="toast-icon">✓</span>{toast}</div>}
    </div>
  );
}

import { useState } from 'react';
import { runAgent, createIdea } from '../lib/api';
import { renderMarkdown } from '../lib/sanitize';
import { IconFire, IconIdea, IconSkills } from './icons';

interface BreakdownPageProps {
  persona: string;
}

export default function BreakdownPage({ persona }: BreakdownPageProps) {
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');

  const run = async () => {
    if (!input.trim()) return;
    setLoading(true); setResult('');
    const prompt =
      `Du bist Experte für die Analyse viraler Inhalte. Analysiere den folgenden Inhalt und antworte auf Deutsch in Stichpunkten:\n` +
      `1. **In einem Satz**\n` +
      `2. **Hook**: warum der Anfang packt\n` +
      `3. **Struktur**: Abschnitte, Tempo, Informationsaufbau\n` +
      `4. **Warum es funktioniert**: Emotion, Wiedererkennung, Nutzen, Reibung\n` +
      `5. **Kopierbare Vorlage**: die Struktur als Gerüst, das ich direkt übernehmen kann\n` +
      `6. **3 Themen mit diesem Muster${persona ? ` passend zu meinem Profil „${persona}“` : ''}**\n\n` +
      `Zu analysierender Inhalt:\n${input}`;
    try {
      const res = await runAgent(prompt, persona);
      setResult(res.response);
    } catch (e) {
      setResult(e instanceof Error ? e.message : 'Analyse fehlgeschlagen, bitte erneut versuchen');
    } finally { setLoading(false); }
  };

  const saveToIdeas = async () => {
    if (!result) return;
    const firstLine = input.trim().split('\n')[0].slice(0, 24);
    await createIdea({ title: `Analysevorlage: ${firstLine}`, note: result, source: 'Viral-Analyse', status: 'pending' });
    setToast('In den Ideenpool gelegt');
    setTimeout(() => setToast(''), 2200);
  };

  return (
    <div className="page-scroll breakdown-page">
      <div className="page-head">
        <div>
          <h1 className="page-title"><IconFire size={21} /> Viral-Analyse</h1>
          <p className="page-subtitle">Füge einen viralen Post oder Vorbild-Inhalt ein; die KI zerlegt Hook, Struktur und Erfolgsgründe und liefert eine kopierbare Vorlage samt Themen.</p>
        </div>
      </div>

      <div className="breakdown-body">
        <textarea className="field" style={{ minHeight: 160 }} value={input}
          placeholder="Text eines viralen Posts oder gespeicherten Inhalts hier einfügen …"
          onChange={(e) => setInput(e.target.value)} />
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" disabled={loading || !input.trim()} onClick={run}>
            <IconSkills size={15} /> {loading ? 'Wird analysiert …' : 'Analysieren'}
          </button>
          {result && <button className="btn" onClick={saveToIdeas}><IconIdea size={14} /> In den Ideenpool</button>}
          {result && <button className="btn btn-ghost" onClick={() => { setResult(''); setInput(''); }}>Leeren</button>}
        </div>

        {loading && <div className="loading" style={{ padding: 40 }}><div className="spinner" />Die KI analysiert …</div>}
        {result && !loading && (
          <div className="panel" style={{ marginTop: 18 }}>
            <div className="panel-title"><IconFire size={14} /> Ergebnis</div>
            <div className="skill-body-md" dangerouslySetInnerHTML={{ __html: renderMarkdown(result) }} />
          </div>
        )}
      </div>

      {toast && <div className="toast ok"><span className="toast-icon">✓</span>{toast}</div>}
    </div>
  );
}

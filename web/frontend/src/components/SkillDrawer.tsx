import SettingsSelect from './SettingsSelect';
import { useState, useEffect, useMemo, useRef } from 'react';
import { fetchSkillDetail, executeSkill, saveEnv } from '../lib/api';
import type { SkillDetail } from '../lib/api';
import { renderMarkdown } from '../lib/sanitize';
import { displayName } from '../lib/skillDisplayNames';

interface SkillDrawerProps {
  skillName: string;
  persona: string;
  onClose: () => void;
  onConfigured: () => void;   // 保存 API 后通知父组件刷新卡片状态
}

export default function SkillDrawer({ skillName, persona, onClose, onConfigured }: SkillDrawerProps) {
  const [detail, setDetail] = useState<SkillDetail | null>(null);
  const [loadErr, setLoadErr] = useState('');

  // API 配置输入（env -> 明文，只提交非空项）
  const [envInputs, setEnvInputs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  // 执行区
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [running, setRunning] = useState(false);
  const [runErr, setRunErr] = useState('');
  const reqSeq = useRef(0);

  const loadDetail = () => {
    let ignore = false;
    fetchSkillDetail(skillName)
      .then((d) => { if (!ignore) { setDetail(d); setLoadErr(''); } })
      .catch(() => { if (!ignore) setLoadErr('SKILL-Details konnten nicht geladen werden'); });
    return () => { ignore = true; };
  };

  useEffect(loadDetail, [skillName]);

  const bodyHtml = useMemo(() => renderMarkdown(detail?.body || ''), [detail?.body]);
  const resultHtml = useMemo(() => renderMarkdown(result), [result]);

  const handleSaveEnv = async () => {
    const updates = Object.fromEntries(
      Object.entries(envInputs).filter(([, v]) => v.trim() !== '')
    );
    if (Object.keys(updates).length === 0) { setSavedMsg('Kein neuer Wert eingetragen'); return; }
    setSaving(true);
    setSavedMsg('');
    try {
      await saveEnv(updates);
      setEnvInputs({});
      const seq = ++reqSeq.current;
      const fresh = await fetchSkillDetail(skillName);
      if (seq === reqSeq.current) setDetail(fresh);
      setSavedMsg('Gespeichert ✓');
      onConfigured();
      setTimeout(() => setSavedMsg(''), 2500);
    } catch (e) {
      setSavedMsg(e instanceof Error ? e.message : 'Speichern fehlgeschlagen');
    } finally {
      setSaving(false);
    }
  };

  const handleRun = async () => {
    if (!input.trim()) return;
    const seq = ++reqSeq.current;
    setRunning(true);
    setRunErr('');
    setResult('');
    try {
      const res = await executeSkill(skillName, input.trim(), persona || undefined);
      if (seq === reqSeq.current) setResult(res.response);
    } catch (e) {
      if (seq === reqSeq.current) setRunErr(e instanceof Error ? e.message : 'Ausführung fehlgeschlagen');
    } finally {
      if (seq === reqSeq.current) setRunning(false);
    }
  };

  const blocked = detail?.needsApi && !detail.apiConfigured;

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div className="skill-detail-title">{displayName(skillName)}</div>
              <div className="skill-detail-rawname">{skillName}</div>
              <div className="skill-detail-meta">
                {detail?.layer && <span className="badge badge-accent">{{discover:'Entdecken',plan:'Planen',produce:'Produzieren',publish:'Veröffentlichen',attribute:'Auswerten',general:'Allgemein'}[detail.layer] || detail.layer}</span>}
                {detail?.needsApi && (
                  detail.apiConfigured
                    ? <span className="badge badge-ok">✓ Eingerichtet</span>
                    : <span className="badge badge-warn">❗ API einrichten</span>
                )}
              </div>
            </div>
            <button className="icon-btn" onClick={onClose} title="Schließen">×</button>
          </div>
        </div>

        <div className="drawer-body">
          {loadErr && <div style={{ color: 'var(--red)', fontSize: 14 }}>{loadErr}</div>}

          {/* API 配置 */}
          {detail?.needsApi && detail.apiSpec && (
            <div className="panel">
              <div className="panel-title">🔑 {detail.apiSpec.label} · API-Einstellungen
                <span style={{ fontWeight: 400, color: 'var(--text-secondary)', fontSize: 12 }}>
                  (ein beliebiger Anbieter vollständig ausgefüllt genügt)
                </span>
              </div>
              {detail.apiSpec.settings.length > 0 && (
                <div className="provider-block">
                  <div className="provider-head"><strong style={{ fontSize: 13 }}>Standardauswahl und Fähigkeiten</strong></div>
                  {detail.apiSpec.settings.map((k) => (
                    <div key={k.env}>
                      <label className="field-label">
                        {k.label} · optional
                        {k.configured && <span style={{ color: 'var(--green)', marginLeft: 6 }}>
                          Eingerichtet{k.masked ? `: ${k.masked}` : ''}
                        </span>}
                      </label>
                      {k.choices.length > 0 ? (
                        <SettingsSelect label={k.label} value={envInputs[k.env] ?? ''}
                          options={[{ value: '', label: k.configured ? `Aktuell: ${k.masked}` : `Bitte wählen: ${k.env}` },
                            ...k.choices.map(choice => ({ value: choice, label: choice }))]}
                          onChange={(value) => setEnvInputs(p => ({ ...p, [k.env]: value }))} />
                      ) : (
                        <input
                          className="field"
                          type={k.secret ? 'password' : 'text'}
                          placeholder={k.configured ? 'Leer lassen = unverändert, Eingabe überschreibt' : `Bitte eingeben: ${k.env}`}
                          value={envInputs[k.env] || ''}
                          onChange={(e) => setEnvInputs((p) => ({ ...p, [k.env]: e.target.value }))}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
              {detail.apiSpec.providers.map((prov) => {
                const provOk = prov.keys.filter(k => k.required).every(k => k.configured);
                return (
                  <div key={prov.id} className={`provider-block ${provOk ? 'configured' : ''}`}>
                    <div className="provider-head">
                      <strong style={{ fontSize: 13 }}>{prov.name}</strong>
                      {provOk
                        ? <span className="badge badge-ok">✓ Bereit</span>
                        : <span className="badge">Nicht eingerichtet</span>}
                    </div>
                    {prov.keys.map((k) => (
                      <div key={k.env}>
                        <label className="field-label">
                          {k.label}{k.required ? '' : ' · optional'}
                          {k.configured && <span style={{ color: 'var(--green)', marginLeft: 6 }}>
                            Eingerichtet{k.secret && k.masked ? ` (${k.masked})` : k.masked ? `: ${k.masked}` : ''}
                          </span>}
                        </label>
                        {k.choices.length > 0 ? (
                          <SettingsSelect label={k.label} value={envInputs[k.env] ?? ''}
                          options={[{ value: '', label: k.configured ? `Aktuell: ${k.masked}` : `Bitte wählen: ${k.env}` },
                            ...k.choices.map(choice => ({ value: choice, label: choice }))]}
                          onChange={(value) => setEnvInputs(p => ({ ...p, [k.env]: value }))} />
                        ) : (
                          <input
                            className="field"
                            type={k.secret ? 'password' : 'text'}
                            placeholder={k.configured ? 'Leer lassen = unverändert, Eingabe überschreibt' : `Bitte eingeben: ${k.env}`}
                            value={envInputs[k.env] || ''}
                            onChange={(e) => setEnvInputs((p) => ({ ...p, [k.env]: e.target.value }))}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                <button className="btn btn-primary btn-sm" onClick={handleSaveEnv} disabled={saving}>
                  {saving ? 'Wird gespeichert …' : 'In .env speichern'}
                </button>
                {savedMsg && <span style={{ fontSize: 13, color: savedMsg.includes('✓') ? 'var(--green)' : 'var(--text-secondary)' }}>{savedMsg}</span>}
              </div>
            </div>
          )}

          {/* 执行 */}
          <div className="panel">
            <div className="panel-title">▶ Ausführen</div>
            {blocked && (
              <div style={{ fontSize: 13, color: 'var(--amber)', marginBottom: 10 }}>
                Dieser SKILL braucht zuerst die API-Einstellungen oben.
              </div>
            )}
            <textarea
              className="field"
              placeholder="Eingabe, z. B. Thema / Material / Anforderungen …"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{ minHeight: 100 }}
            />
            <div style={{ marginTop: 10 }}>
              <button className="btn btn-primary" onClick={handleRun} disabled={running || !input.trim() || blocked}>
                {running
                  ? <><span className="spinner" style={{ width: 14, height: 14, margin: 0 }} />Läuft …</>
                  : 'Ausführen'}
              </button>
            </div>
            {runErr && <div style={{ color: 'var(--red)', fontSize: 13, marginTop: 10 }}>{runErr}</div>}
            {resultHtml && (
              <div className="skill-result" dangerouslySetInnerHTML={{ __html: resultHtml }} />
            )}
          </div>

          {/* 描述 */}
          <div className="panel">
            <div className="panel-title">📖 Beschreibung</div>
            {detail
              ? <div className="skill-body-md" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
              : !loadErr && <div className="loading"><div className="spinner" />Wird geladen …</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

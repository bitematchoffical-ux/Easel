import { useState, useRef, useEffect, useCallback } from 'react';
import {
  createSchedule, executeSkill, runAgent, streamChat,
  fetchAccounts, publishNow, publishStatus, submitPublishSms, fetchOutputs, mediaUrl,
} from '../lib/api';
import type { AccountItem, OutputFile } from '../lib/api';
import { loadPublishDraft, savePublishDraft } from '../lib/store';
import { renderMarkdown } from '../lib/sanitize';
import { IconPublish, IconCopy, IconCheck, IconCalendar, IconSkills, IconEdit, IconStop, IconTrash } from './icons';

interface PublishPageProps {
  persona: string;
}

// 平台列表须与后端 LOGIN_RUNNERS 对齐（有登录/发布链路的才列）
// draft: true = 该平台支持「存草稿」（落后台草稿箱，不公开发布）
const PLATFORMS: { key: string; label: string; titleLimit?: number; bodyLimit: number; hint: string; draft?: boolean }[] = [
  { key: 'twitter-x', label: 'X', bodyLimit: 280, hint: 'Titel und Text werden zusammengeführt, maßgeblich ist die Prüfung von X; 1 Bild oder 1 Video möglich; die Fensteranmeldung braucht auf dem Postloop-Rechner einen grafischen Desktop und Internet' },
];
const LABEL2KEY = Object.fromEntries(PLATFORMS.map((p) => [p.label, p.key]));

// 能一键发布的平台（有后端 publisher）
const PUBLISHABLE = new Set(['twitter-x']);
// 必须附带媒体的平台（无媒体发不了）——公众号需要一张封面图，也计入；X 纯文字推文合法，不计入
const MEDIA_REQUIRED = new Set<string>();
// 只能发视频的平台（抖音/视频号/B站：图文不走此链路，必须视频）
const VIDEO_ONLY = new Set<string>();
const VIDEO_RE = /\.(mp4|mov|webm|mkv|avi|m4v|flv|ts)$/i;

function parseSections(text: string): Record<string, string> {
  const parts = text.split(/^\s*={2,}\s*(.+?)\s*={2,}\s*$/m);
  const map: Record<string, string> = {};
  for (let i = 1; i < parts.length; i += 2) map[parts[i].trim()] = (parts[i + 1] || '').trim();
  return map;
}

type PubState = { status: 'publishing' | 'ok' | 'fail'; msg: string };

export default function PublishPage({ persona }: PublishPageProps) {
  const draft0 = loadPublishDraft();
  const [title, setTitle] = useState(draft0.title);
  const [body, setBody] = useState(draft0.body);
  const [platforms, setPlatforms] = useState<string[]>(draft0.platforms);
  const [overrides, setOverrides] = useState<Record<string, string>>(draft0.overrides);
  const [tags, setTags] = useState(draft0.tags || '');
  // 存草稿模式：只对声明了 draft 能力的平台（今日头条）生效，其余平台仍真发布
  const [asDraft, setAsDraft] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [copied, setCopied] = useState('');
  const [toast, setToast] = useState('');
  const [adapting, setAdapting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState('');
  const adaptCtl = useRef<AbortController | null>(null);
  // 异步发布轮询的 interval 集合：离开页面统一清掉，否则最长还会继续转 15 分钟
  const pollTimers = useRef<Set<ReturnType<typeof setInterval>>>(new Set());
  const aliveRef = useRef(true);

  // 发布相关
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [mediaFiles, setMediaFiles] = useState<OutputFile[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [pub, setPub] = useState<Record<string, PubState>>({});
  const [publishing, setPublishing] = useState(false);
  // 发布时的短信验证窗口（抖音风控条件触发；没触发就不弹）
  const [pubSms, setPubSms] = useState<{ platform: string; name: string; state: string; message: string } | null>(null);
  const [pubSmsCode, setPubSmsCode] = useState('');
  const [pubSmsBusy, setPubSmsBusy] = useState(false);

  // 草稿持久化：任何改动即写 localStorage，切页/刷新回来都在
  useEffect(() => {
    savePublishDraft({ title, body, platforms, overrides, tags });
  }, [title, body, platforms, overrides, tags]);

  const cleanupPublishActivity = useCallback(() => {
    // 卸载：中止流 + 停掉所有发布状态轮询（否则在后台空转最长 15 分钟）
    aliveRef.current = false;
    adaptCtl.current?.abort();
    pollTimers.current.forEach((iv) => clearInterval(iv));
    pollTimers.current.clear();
  }, []);

  useEffect(() => {
    aliveRef.current = true;
    return cleanupPublishActivity;
  }, [cleanupPublishActivity]);

  // 登录态 + 可选媒体列表
  useEffect(() => {
    fetchAccounts().then(setAccounts).catch(() => { /* 忽略 */ });
    fetchOutputs().then((roots) => {
      const files: OutputFile[] = [];
      const walk = (n: OutputFile) => {
        if (n.type === 'file') { if (n.kind === 'image' || n.kind === 'video') files.push(n); return; }
        for (const c of n.children || []) walk(c);
      };
      roots.forEach(walk);
      files.sort((a, b) => (b.mtime || 0) - (a.mtime || 0));
      setMediaFiles(files);
    }).catch(() => { /* 忽略 */ });
  }, []);

  const loginOf = (key: string) => accounts.find((a) => a.platform === key)?.loggedIn ?? false;

  const toggle = (k: string) =>
    setPlatforms((prev) => prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]);
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2800); };
  const effective = (k: string) => overrides[k] ?? body;
  const empty = !title.trim() && !body.trim();
  const isVideoPath = (p: string) => /\.(mp4|mov|flv|mkv|avi|webm|m4v|wmv|ts|mpe?g)$/i.test(p);
  const toggleMedia = (path: string) =>
    setSelectedMedia((prev) => {
      if (prev.includes(path)) return prev.filter((x) => x !== path);
      // 通用规则：图片和视频不能同时；视频一次只发一个
      if (isVideoPath(path)) {
        if (prev.length && !prev.every(isVideoPath)) { showToast('Bilder und Videos können nicht zusammen gepostet werden; bitte zuerst die ausgewählten Bilder entfernen'); return prev; }
        return [path]; // 视频单选
      }
      if (prev.some(isVideoPath)) { showToast('Bilder und Videos können nicht zusammen gepostet werden; bitte zuerst das ausgewählte Video entfernen'); return prev; }
      return [...prev, path]; // 图片可多选（图文）
    });

  // A. 智能一稿多改（流式：逐字改写，直接流进每个平台卡片）
  const adapt = () => {
    if (empty || platforms.length === 0 || adapting) return;
    const sel = PLATFORMS.filter((p) => platforms.includes(p.key));
    const prompt =
      `Bitte /skill-content-repurposing ausführen: Diesen Inhalt für folgende Plattformen umschreiben: ${sel.map((p) => p.label).join(', ')}.` +
      `Unbedingt platform-specs und Umschreib-Rezepte dieses SKILLs beachten und Format, Ton und Länge jeder Plattform treffen.\n` +
      `[Pflicht] Für jede Plattform einen „direkt kopierbaren Klartext“ ausgeben, ohne Markdown: kein **fett**, keine # Überschriften, kein ---, keine Tabellen, keine Codeblöcke, keine Aufzählungszeichen; ` +
      `Emojis und #Hashtags sind erlaubt, Zeilenumbrüche wie auf der Plattform üblich.\n` +
      `Streng nur im folgenden Format antworten, Plattformen durch Trennlinien getrennt, ohne zusätzliche Erklärungen:\n` +
      sel.map((p) => `===${p.label}===\n<Klartext für diese Plattform>`).join('\n') +
      `\n\nOriginalinhalt:\nTitel: ${title}\nText: ${body}`;

    setAdapting(true);
    let acc = '';
    const base = { ...overrides };
    adaptCtl.current = streamChat(
      prompt, persona, `adapt-${Date.now()}`,
      (chunk) => {                       // 逐字：实时解析并流进对应平台卡片
        acc += chunk;
        const map = parseSections(acc);
        const next = { ...base };
        for (const [label, text] of Object.entries(map)) {
          const key = LABEL2KEY[label];
          if (key && platforms.includes(key)) next[key] = text;
        }
        setOverrides(next);
      },
      () => {                            // 完成
        const hit = Object.keys(parseSections(acc)).length;
        setAdapting(false);
        showToast(hit ? `Erstellt: ${hit} Plattformversionen` : 'Konnte nicht ausgewertet werden, bitte erneut versuchen');
      },
      () => { setAdapting(false); showToast('Umschreiben fehlgeschlagen, bitte erneut versuchen'); },
    );
  };
  const stopAdapt = () => { adaptCtl.current?.abort(); setAdapting(false); };

  const performPrecheck = async () => {
    const prompt =
      `Du bist Prüfassistent für Social-Media-Posts. Prüfe den folgenden Post in zwei Punkten und antworte knapp auf Deutsch in Stichpunkten:\n` +
      `1. **Rechtliche Risiken**: Superlative ohne Beleg, Heilversprechen, sensible oder unzulässige Aussagen, fehlende Werbe- oder KI-Kennzeichnung; Problemwort + Ersatzvorschlag nennen; sonst "keine offensichtlichen Risiken".\n` +
      `2. **Titel/Hook**: Titel mit 1–10 bewerten und 1–2 bessere Alternativen nennen.\n` +
      `In der letzten Zeile ein Fazit: „✅ Kann raus / ⚠️ Bitte überarbeiten“.\n\nZu prüfender Inhalt:\nTitel: ${title}\nText: ${body}`;
    const content = `Zu veröffentlichender Inhalt:\nTitel: ${title}\nText: ${body}`;
    const [general, personaResult] = await Promise.all([
      runAgent(prompt),
      persona ? executeSkill('persona-check', content, persona) : Promise.resolve(null),
    ]);
    return `${general.response}\n\n---\n\n## Profil-Passung\n\n${personaResult?.response || 'Kein Profil gewählt, Profilprüfung übersprungen.'}`;
  };

  // C. 发布前一键预检
  const check = async () => {
    if (empty) return;
    setChecking(true); setCheckResult('');
    try {
      setCheckResult(await performPrecheck());
    } catch (e) {
      setCheckResult(e instanceof Error ? e.message : 'Vorabcheck fehlgeschlagen');
    } finally { setChecking(false); }
  };

  // D. 一键发布（真发布，二次确认）
  const publishAll = async () => {
    if (empty || publishing || checking) return;
    const targets = PLATFORMS.filter((p) => platforms.includes(p.key) && PUBLISHABLE.has(p.key));
    if (targets.length === 0) {
      showToast('Die gewählten Plattformen unterstützen kein automatisches Posten (bitte „Kopieren“ oder den Export nutzen)');
      return;
    }
    setChecking(true);
    try {
      setCheckResult(await performPrecheck());
    } catch (e) {
      setCheckResult(`Vorabcheck fehlgeschlagen: ${e instanceof Error ? e.message : 'Unbekannter Fehler'}\n\nDer Vorabcheck ist nur ein Hinweis und hält dich nicht vom Posten ab.`);
    } finally {
      setChecking(false);
    }
    // 存草稿只对声明 draft 能力的平台（今日头条）生效；其余平台一律真发布
    const draftTargets = asDraft ? targets.filter((t) => t.draft) : [];
    const liveTargets = asDraft ? targets.filter((t) => !t.draft) : targets;
    const okToSend = window.confirm(
      `Der Vorabcheck wurde ausgeführt, das Ergebnis steht auf der Seite. Die Profilbewertung ist nur ein Hinweis und blockiert nicht.\n\n` +
      (draftTargets.length
        ? `Wird [als Entwurf gespeichert]: ${draftTargets.map((t) => t.label).join(', ')} (nicht öffentlich).\n`
        : '') +
      (liveTargets.length
        ? `Wird [wirklich veröffentlicht] auf: ${liveTargets.map((t) => t.label).join(', ')}.\n` +
          `Das wird öffentlich auf deinem Konto gepostet. Fortfahren?`
        : 'Fortfahren?'));
    if (!okToSend) return;

    setPublishing(true);
    for (const t of targets) {
      // 存草稿只对声明 draft 能力的平台生效（今日头条）；其余平台一律真发布
      const asDraftThis = asDraft && !!t.draft;
      if (!loginOf(t.key)) {
        setPub((r) => ({ ...r, [t.key]: { status: 'fail', msg: 'Nicht angemeldet · zur Kontoseite' } }));
        continue;
      }
      if (MEDIA_REQUIRED.has(t.key) && selectedMedia.length === 0) {
        setPub((r) => ({ ...r, [t.key]: { status: 'fail', msg: 'Bild/Video nötig' } }));
        continue;
      }
      if (VIDEO_ONLY.has(t.key) && !selectedMedia.some((p) => VIDEO_RE.test(p))) {
        setPub((r) => ({ ...r, [t.key]: { status: 'fail', msg: `${t.label}Nur Videos möglich, bitte ein Video aus der Inhaltsbibliothek wählen` } }));
        continue;
      }
      setPub((r) => ({ ...r, [t.key]: { status: 'publishing', msg: asDraftThis ? 'Wird als Entwurf gespeichert … kann 1–2 Minuten dauern' : 'Wird gepostet … kann 1–2 Minuten dauern' } }));
      try {
        const res = await publishNow(t.key, { title, body: effective(t.key), media: selectedMedia, tags, persona, draft: asDraftThis });
        if (res.async) {
          // 抖音：异步发布，轮询状态；风控触发短信墙时弹输入框（条件触发，没触发就直接跑完）
          await pollAsyncPublish(t.key, t.label);
        } else {
          setPub((r) => ({
            ...r,
            [t.key]: res.ok
              ? { status: 'ok', msg: asDraftThis ? 'Entwurf gespeichert ✅' : 'Gepostet ✅' }
              : { status: 'fail', msg: res.detail || res.message || 'Posten fehlgeschlagen' },
          }));
        }
      } catch (e) {
        setPub((r) => ({ ...r, [t.key]: { status: 'fail', msg: e instanceof Error ? e.message : 'Posten fehlgeschlagen' } }));
      }
    }
    setPublishing(false);
    showToast('Ablauf beendet, Status siehe Plattformkarten');
  };

  // 异步发布轮询（抖音）：直到 success/error；遇 sms_required/verifying 弹短信窗口
  const pollAsyncPublish = (key: string, label: string) => new Promise<void>((resolve) => {
    const started = Date.now();
    const iv = setInterval(async () => {
      if (!aliveRef.current) { clearInterval(iv); pollTimers.current.delete(iv); resolve(); return; }
      if (Date.now() - started > 15 * 60 * 1000) {   // 15min 兜底
        clearInterval(iv); pollTimers.current.delete(iv); setPubSms(null);
        setPub((r) => ({ ...r, [key]: { status: 'fail', msg: 'Zeitüberschreitung beim Posten' } }));
        resolve(); return;
      }
      let s;
      try { s = await publishStatus(key); } catch { return; }  // 单次失败忽略
      if (s.state === 'sms_required' || s.state === 'verifying') {
        setPubSms({ platform: key, name: label, state: s.state, message: s.message });
        setPub((r) => ({ ...r, [key]: { status: 'publishing', msg: s.message || 'SMS-Bestätigung nötig' } }));
      } else if (s.state === 'success') {
        clearInterval(iv); pollTimers.current.delete(iv); setPubSms(null);
        setPub((r) => ({ ...r, [key]: { status: 'ok', msg: 'Gepostet ✅' } }));
        resolve();
      } else if (s.state === 'error') {
        clearInterval(iv); pollTimers.current.delete(iv); setPubSms(null);
        setPub((r) => ({ ...r, [key]: { status: 'fail', msg: s.message || 'Posten fehlgeschlagen' } }));
        resolve();
      } else {
        setPub((r) => ({ ...r, [key]: { status: 'publishing', msg: s.message || 'Wird gepostet …' } }));
      }
    }, 2500);
    pollTimers.current.add(iv);
  });

  const submitPubSms = async () => {
    if (!pubSms) return;
    const code = pubSmsCode.replace(/\D/g, '');
    if (code.length < 4) { showToast('Der Code muss 4–6 Ziffern haben'); return; }
    setPubSmsBusy(true);
    try {
      await submitPublishSms(pubSms.platform, code);
      setPubSmsCode('');
      setPubSms((p) => p && ({ ...p, state: 'verifying', message: 'Code wird geprüft …' }));
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Senden fehlgeschlagen');
    } finally {
      setPubSmsBusy(false);
    }
  };

  const copyFor = (key: string) => {
    const text = (title ? title + '\n\n' : '') + effective(key);
    navigator.clipboard?.writeText(text);
    setCopied(key); setTimeout(() => setCopied(''), 1400);
  };
  const addToCalendar = async (key: string) => {
    if (empty) return;
    // 用本地日期（日历页按本地渲染）：toISOString 是 UTC，东八区 0-8 点会落到「昨天」
    const d = new Date();
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    await createSchedule({
      title: title.trim() || effective(key).slice(0, 20), date,
      platform: PLATFORMS.find((p) => p.key === key)?.label || '', time: '', status: 'draft', note: effective(key),
    });
    showToast('Als Entwurf gespeichert und im heutigen Kalender eingetragen');
  };

  const canPublish = platforms.some((k) => PUBLISHABLE.has(k));
  // 已选平台里支持存草稿的（目前只有今日头条）——没有就不显示开关，避免误导
  const draftCapable = PLATFORMS.filter((p) => platforms.includes(p.key) && p.draft);

  return (
    <div className="publish-page">
      <div className="publish-editor">
        <h1 className="page-title"><IconPublish size={21} /> Veröffentlichen</h1>
        <p className="page-subtitle">Einmal schreiben → KI passt für jede Plattform an → Vorabcheck → Medien anhängen → mit einem Klick posten.</p>

        <label className="field-label">Titel</label>
        <input className="field" value={title} placeholder="Titel (für manche Plattformen nötig)"
          onChange={(e) => setTitle(e.target.value)} />
        <label className="field-label">Text (Vorlage)</label>
        <textarea className="field" style={{ minHeight: 180 }} value={body}
          placeholder="Schreib deinen Inhalt; rechts siehst du die Vorschau je Plattform. „Für alle anpassen“ lässt die KI pro Plattform umschreiben …"
          onChange={(e) => setBody(e.target.value)} />

        <label className="field-label">Hashtags <span style={{ color: 'var(--text-secondary)', fontWeight: 400, fontSize: 12 }}>(durch Komma getrennt, z. B. „KI,Karriere,Tipps“)</span></label>
        <input className="field" value={tags} placeholder="KI,Karriere,Tipps"
          onChange={(e) => setTags(e.target.value)} />

        <label className="field-label">Plattformen</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {PLATFORMS.map((p) => (
            <button key={p.key} className={`chip ${platforms.includes(p.key) ? 'active' : ''}`}
              onClick={() => toggle(p.key)}>{p.label}</button>
          ))}
        </div>
        {draftCapable.length > 0 && (
          <label className="draft-toggle">
            <input type="checkbox" checked={asDraft} onChange={(e) => setAsDraft(e.target.checked)} />
            <span>Als Entwurf ({draftCapable.map((p) => p.label).join(', ')} landet im Entwurfsordner der Plattform, nicht öffentlich; andere Plattformen im selben Durchgang werden wirklich gepostet)</span>
          </label>
        )}

        <label className="field-label" style={{ marginTop: 14 }}>
          Medien {selectedMedia.length > 0 && <span className="pv-badge">{selectedMedia.length} </span>}
          <span style={{ color: 'var(--text-secondary)', fontWeight: 400, fontSize: 12 }}>(aus der Inhaltsbibliothek wählen; manche Plattformen brauchen Bild oder Video)</span>
        </label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button className="btn btn-sm" onClick={() => setShowPicker((v) => !v)}>
            <IconSkills size={13} /> {showPicker ? 'Einklappen' : 'Medien wählen'}
          </button>
          {selectedMedia.map((path) => (
            <div key={path} className="media-chip" onClick={() => toggleMedia(path)} title="Zum Entfernen klicken">
              {mediaFiles.find((f) => f.path === path)?.kind === 'image'
                ? <img src={mediaUrl(path)} alt="" /> : <span className="media-vid">🎬</span>}
              <span className="media-x">×</span>
            </div>
          ))}
        </div>
        {showPicker && (
          <div className="media-grid">
            {mediaFiles.length === 0 && <div className="dash-empty">Noch keine Bilder/Videos in der Inhaltsbibliothek</div>}
            {mediaFiles.slice(0, 40).map((f) => (
              <div key={f.path}
                className={`media-cell ${selectedMedia.includes(f.path) ? 'sel' : ''}`}
                onClick={() => toggleMedia(f.path)} title={f.path}>
                {f.kind === 'image'
                  ? <img src={mediaUrl(f.path)} alt={f.name} loading="lazy" />
                  : <span className="media-vid">🎬<br />{f.name.slice(0, 12)}</span>}
                {selectedMedia.includes(f.path) && <span className="media-check">✓</span>}
              </div>
            ))}
          </div>
        )}

        <div className="publish-actions">
          {adapting ? (
            <button className="btn btn-sm" onClick={stopAdapt}><IconStop size={13} /> Stopp</button>
          ) : (
            <button className="btn btn-sm btn-primary" disabled={empty || platforms.length === 0} onClick={adapt}>
              <IconSkills size={14} /> Für alle Plattformen anpassen
            </button>
          )}
          <button className="btn btn-sm" disabled={empty || checking || adapting} onClick={check}>
            <IconCheck size={14} /> {checking ? 'Wird geprüft …' : 'Vorabcheck'}
          </button>
          <button className="btn btn-sm" disabled={empty} onClick={() => addToCalendar(platforms[0] || 'twitter-x')}>
            <IconCalendar size={14} /> Als Entwurf speichern und einplanen
          </button>
          <button className="btn btn-sm btn-primary" disabled={empty || publishing || checking || !canPublish}
            title={canPublish ? 'Auf angemeldeten Plattformen wirklich posten' : 'Für die gewählten Plattformen gibt es kein automatisches Posten (Export nutzen)'}
            onClick={publishAll}>
            <IconPublish size={14} /> {publishing ? 'Wird gepostet …' : 'Mit einem Klick posten'}
          </button>
          <button className="btn btn-sm btn-ghost" disabled={empty || adapting}
            onClick={() => { setTitle(''); setBody(''); setTags(''); setOverrides({}); setCheckResult(''); setPub({}); showToast('Geleert'); }}>
            <IconTrash size={13} /> Leeren
          </button>
        </div>
        {adapting && <div className="adapt-hint"><span className="live-pulse" />Die KI schreibt die Plattformversionen um … jederzeit stoppbar.</div>}
        <p className="publish-saved-note">Entwurf wird automatisch gespeichert und bleibt beim Seitenwechsel oder Neuladen erhalten. Gepostet wird nur auf Plattformen, die angemeldet sind und alle Medien haben.</p>
        {checkResult && (
          <div className="panel" style={{ marginTop: 14 }}>
            <div className="panel-title"><IconCheck size={14} /> Vorabcheck</div>
            <div className="skill-body-md" dangerouslySetInnerHTML={{ __html: renderMarkdown(checkResult) }} />
          </div>
        )}
      </div>

      <div className="publish-previews">
        {platforms.length === 0 && <div className="dash-empty">Mindestens eine Plattform wählen, um die Vorschau zu sehen</div>}
        {PLATFORMS.filter((p) => platforms.includes(p.key)).map((p) => {
          const text = effective(p.key);
          const over = text.length > p.bodyLimit;
          const titleOver = p.titleLimit != null && title.length > p.titleLimit;
          const isEdit = editing === p.key;
          const ps = pub[p.key];
          const publishable = PUBLISHABLE.has(p.key);
          const logged = loginOf(p.key);
          return (
            <div key={p.key} className={`card pv-card pv-${p.key}`}>
              <div className="pv-head">
                <span className="pv-plat">
                  {p.label}
                  {overrides[p.key] != null && <span className="pv-badge">KI-Version</span>}
                  {publishable && (logged
                    ? <span className="pv-badge pv-badge-ok">Angemeldet</span>
                    : <span className="pv-badge">Nicht angemeldet</span>)}
                </span>
                <span className={`pv-count ${over ? 'over' : ''}`}>{text.length}/{p.bodyLimit}</span>
              </div>
              <div className="pv-body">
                {p.titleLimit != null && (
                  <div className={`pv-title ${titleOver ? 'over' : ''}`}>{title || <span className="pv-ph">Titel …</span>}</div>
                )}
                {isEdit
                  ? <textarea className="field" style={{ minHeight: 120 }} value={text} autoFocus
                      onChange={(e) => setOverrides((o) => ({ ...o, [p.key]: e.target.value }))} />
                  : <div className="pv-text">{text || <span className="pv-ph">Textvorschau …</span>}{adapting && overrides[p.key] != null && <span className="streaming-cursor" />}</div>}
              </div>
              {ps && (
                <div className={`pv-pubstate ${ps.status}`}>
                  {ps.status === 'publishing' && <span className="live-pulse" />}
                  {ps.status === 'ok' ? '✅ ' : ps.status === 'fail' ? '⚠️ ' : ''}{ps.msg}
                </div>
              )}
              <div className="pv-foot">
                <span className="pv-hint">{p.hint}{over ? ' · zu lang' : ''}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="pv-copy" onClick={() => setEditing(isEdit ? null : p.key)}>
                    <IconEdit size={13} />{isEdit ? 'Fertig' : 'Bearbeiten'}
                  </button>
                  <button className="pv-copy" onClick={() => copyFor(p.key)}>
                    {copied === p.key ? <IconCheck size={13} /> : <IconCopy size={13} />}{copied === p.key ? 'Kopiert' : 'Kopieren'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {toast && <div className="toast ok"><span className="toast-icon">✓</span>{toast}</div>}

      {pubSms && (
        <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) setPubSms(null); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 380 }}>
            <h3 style={{ margin: '0 0 4px' }}>Prüfung · {pubSms.name}</h3>
            <p style={{ fontSize: 13, color: /错误|过期|失败|重新|未完成|不正确|失效/.test(pubSms.message || '') ? 'var(--red)' : 'var(--text-secondary)' }}>
              {pubSms.message || 'Die Plattform verlangt eine SMS-Bestätigung; der Code wurde an dein Handy gesendet, bitte eingeben:'}
            </p>
            {pubSms.state === 'verifying' ? (
              <div className="dash-empty" style={{ padding: 16 }}>Code wird geprüft …</div>
            ) : (
              <>
                <input inputMode="numeric" autoFocus
                  placeholder="Bitte den Code aus der SMS eingeben" value={pubSmsCode}
                  onChange={(e) => setPubSmsCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  onKeyDown={(e) => { if (e.key === 'Enter') submitPubSms(); }}
                  style={{ width: '100%', boxSizing: 'border-box', textAlign: 'center',
                    letterSpacing: 6, fontSize: 20, padding: '10px 12px', margin: '4px 0 10px',
                    border: '1px solid var(--border)', borderRadius: 8 }} />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button className="btn btn-sm btn-ghost" onClick={() => setPubSms(null)}>Schließen</button>
                  <button className="btn btn-sm btn-primary" disabled={pubSmsBusy} onClick={submitPubSms}>
                    {pubSmsBusy ? 'Wird gesendet …' : 'Code senden'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

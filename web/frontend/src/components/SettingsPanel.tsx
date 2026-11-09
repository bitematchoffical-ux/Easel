import { useCallback, useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import EnvBoard from './EnvBoard';
import HarnessSettings from './HarnessSettings';
import SettingsSelect, { OptionsDropdown } from './SettingsSelect';
import type { JobView } from './EnvBoard';
import {
  fetchEnvTools, startEnvInstall, fetchEnvJob,
  fetchModelChannels, runChannelSelftest, saveModelConfig,
  fetchLocalAgents, enableLocalAgent, fetchAvailableModels,
  fetchProxySettings, saveProxySettings,
} from '../lib/api';
import type { EnvTool, ModelRow, SelftestResult, LocalAgentInfo, ProxySettings } from '../lib/api';
import { IconSlidersHorizontal, IconPackage, IconEllipsis } from './settingsIcons';

interface Props {
  onClose: () => void;
  /** 非空时在面板顶部显示一条提示条。首开未配置模型时由 App 传入。 */
  banner?: string;
}

type Sec = 'model' | 'env' | 'more';
type Chan = 'chat' | 'transcribe' | 'speech' | 'image' | 'video' | 'music';

const CHANNELS: { id: Chan; label: string }[] = [
  { id: 'chat', label: 'Chat und Skripte' },
  { id: 'transcribe', label: 'Transkription' },
  { id: 'speech', label: 'Vertonung' },
  { id: 'image', label: 'Bilder' },
  { id: 'video', label: 'Video' },
  { id: 'music', label: 'Musik' },
];

/** 后台繁忙（整机高负载）时的抗抖动取数：单次超时即重试，撑过多秒级接口延迟。 */
async function fetchWithRetry<T>(fn: () => Promise<T>, tries = 4, timeoutMs = 18000): Promise<T> {
  let lastErr: unknown = new Error('Abruf fehlgeschlagen');
  for (let i = 0; i < tries; i += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      return await new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Zeitüberschreitung')), timeoutMs);
        fn().then(
          (v) => { clearTimeout(timer); resolve(v); },
          (e) => { clearTimeout(timer); reject(e); },
        );
      });
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

/** 后端放在 model/baseUrl 里的展示占位串——提交前要清掉，它们不是真实配置值。 */
const PLACEHOLDERS = new Set(['—', '官方', '（未配置）', '本机', '内建默认']);

// Postloop: Das Backend liefert einige Anzeige- und Vergleichswerte auf Chinesisch
// (z. B. '已配置', '本机'). Die Werte selbst bleiben unverändert, weil sie verglichen
// und zurückgeschickt werden; übersetzt wird nur die Anzeige.
const ZH_DISPLAY: Record<string, string> = {
  '已配置': 'Eingerichtet', '未配置': 'Nicht eingerichtet', '缺 key': 'Schlüssel fehlt',
  '缺配置': 'Unvollständig', '已就绪': 'Bereit', '优先': 'Vorrang', '免配': 'Ohne Einrichtung',
  '官方': 'Offiziell', '（未配置）': '(nicht eingerichtet)', '本机': 'Lokal', '内建默认': 'Standard (eingebaut)',
  '«已配置»': '«eingerichtet»', '官方直连': 'Direkt beim Anbieter', '中转站': 'Zwischenstelle',
  '自定义': 'Eigener Anbieter', '独立直连配置': 'Eigene Direktverbindung', '本地 / 内网 API 直连': 'Lokale API / Netzwerk-API',
  '自带字幕': 'Vorhandene Untertitel', '视频自带 SRT/VTT 时直接读': 'Liest SRT/VTT direkt, wenn das Video sie mitbringt',
  '脚本层': 'Skript', '硅基流动': 'SiliconFlow',
};
const zh = (v: string | undefined | null): string => (v ? ZH_DISPLAY[v] ?? v : v ?? '');

const hhmm = (ts: number) => {
  const d = new Date(ts * 1000);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/** 设置（统一入口）：竖＝功能分类（模型配置 / 环境安装 / 更多设置），横＝模型六通道。 */
export default function SettingsPanel({ onClose, banner = '' }: Props) {
  const [sec, setSec] = useState<Sec>('model');
  const [chan, setChan] = useState<Chan>('chat');
  const [harness, setHarness] = useState('');
  const [selectedHarness, setSelectedHarness] = useState('');

  // ── 环境安装（引擎真实数据） ──────────────────────────────
  const [tools, setTools] = useState<EnvTool[]>([]);
  const [python, setPython] = useState('');
  const [envLoading, setEnvLoading] = useState(true);
  const [envError, setEnvError] = useState('');
  const [jobs, setJobs] = useState<Record<string, JobView>>({});
  const runningRef = useRef(false);

  const refreshEnv = useCallback(async (force = false) => {
    setEnvLoading(true);
    setEnvError('');
    try {
      const d = await fetchWithRetry(() => fetchEnvTools(force));
      setTools(d.tools || []);
      setPython(d.python || '');
    } catch (e) {
      setEnvError(e instanceof Error ? `Umgebungsprüfung fehlgeschlagen: ${e.message}` : 'Umgebungsprüfung fehlgeschlagen');
    } finally {
      setEnvLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sec === 'env') void refreshEnv();
  }, [sec, refreshEnv]);

  // ── 更多设置：网络代理（EASEL_PROXY，落 .env，保存即生效） ──────────────
  const [proxyCfg, setProxyCfg] = useState<ProxySettings | null>(null);
  const [proxyInput, setProxyInput] = useState('');
  const [proxyBusy, setProxyBusy] = useState(false);
  const [proxyMsg, setProxyMsg] = useState('');
  const [proxyErr, setProxyErr] = useState('');

  useEffect(() => {
    if (sec !== 'more') return;
    fetchProxySettings()
      .then((d) => { setProxyCfg(d); setProxyInput(d.proxy); setProxyErr(''); setProxyMsg(''); })
      .catch(() => setProxyErr('Proxy-Einstellung konnte nicht gelesen werden'));
  }, [sec]);

  const saveProxy = useCallback(async (value?: string) => {
    const proxy = (value ?? proxyInput).trim();
    setProxyBusy(true); setProxyErr(''); setProxyMsg('');
    try {
      const r = await saveProxySettings(proxy);
      setProxyCfg({ proxy: r.proxy, source: (r.source as ProxySettings['source']) || 'none' });
      setProxyInput(r.proxy);
      setProxyMsg(r.proxy ? `Gespeichert: ${r.proxy} – gilt sofort, kein Neustart nötig` : 'Proxy-Einstellung entfernt');
    } catch (e) {
      setProxyErr(e instanceof Error ? e.message : 'Speichern fehlgeschlagen');
    } finally {
      setProxyBusy(false);
    }
  }, [proxyInput]);

  const clearProxy = useCallback(() => { setProxyInput(''); void saveProxy(''); }, [saveProxy]);

  const batchMode = useRef(false);

  // 装完统一收尾：刷新体检（期间卡片显示「校验中」），然后清掉成功的 job 记录、保留失败（带原因）
  const settleJobs = useCallback(async () => {
    await refreshEnv(true);
    setJobs((j) => {
      const n: Record<string, JobView> = {};
      Object.entries(j).forEach(([k, v]) => { if (v.state === 'fail') n[k] = v; });
      return n;
    });
  }, [refreshEnv]);

  const pollJob = useCallback((id: string, jobId: string) => new Promise<void>((resolve) => {
    let fails = 0;
    const timer = setInterval(async () => {
      try {
        const st = await fetchEnvJob(jobId);
        const last = (st.lines || [])[st.lines.length - 1] || '';
        setJobs((j) => ({
          ...j,
          [id]: { state: st.state, line: last.trim().slice(0, 140), detail: st.result?.detail || null },
        }));
        if (st.state !== 'running') { clearInterval(timer); resolve(); }
      } catch {
        fails += 1;
        if (fails >= 3) { clearInterval(timer); resolve(); }   // 服务重启/任务丢失：放弃轮询
      }
    }, 1500);
  }), []);

  const installOne = useCallback(async (id: string) => {
    setJobs((j) => ({ ...j, [id]: { state: 'running', line: 'Startet …' } }));
    try {
      const { jobId } = await startEnvInstall(id);
      await pollJob(id, jobId);
    } catch (e) {
      setJobs((j) => ({ ...j, [id]: { state: 'fail', line: '', detail: e instanceof Error ? e.message : 'Start fehlgeschlagen' } }));
    }
    if (!batchMode.current) await settleJobs();   // 单卡装完立即收尾刷新
  }, [pollJob, settleJobs]);

  const installMany = useCallback(async (ids: string[]) => {
    runningRef.current = true;
    batchMode.current = true;
    setJobs((j) => {
      const n = { ...j };
      ids.forEach((id) => { n[id] = { state: 'running', line: 'In der Warteschlange …' }; });
      return n;
    });
    for (const id of ids) {
      // eslint-disable-next-line no-await-in-loop
      await installOne(id);
    }
    batchMode.current = false;
    runningRef.current = false;
    await settleJobs();
  }, [installOne, settleJobs]);

  const anyRunning = runningRef.current || Object.values(jobs).some((j) => j.state === 'running');
  const okCount = tools.filter((t) => t.state === 'ok').length;
  const total = tools.length;

  // ── 模型配置（真值只读 + 真自测） ────────────────────────
  const [chatRows, setChatRows] = useState<ModelRow[]>([]);
  const [transRows, setTransRows] = useState<ModelRow[]>([]);
  const [mediaRows, setMediaRows] = useState<Record<string, ModelRow[]>>({});
  const [modelLoading, setModelLoading] = useState(true);
  const [modelErr, setModelErr] = useState('');
  const [selftest, setSelftest] = useState<{ testedAt: number; byBase: Record<string, SelftestResult> } | null>(null);
  const [testing, setTesting] = useState(false);
  const [selftestNote, setSelftestNote] = useState('');
  // 本机 agent CLI（Claude Code / Gemini CLI…）：装了并登录过就免 API key
  const [localAgents, setLocalAgents] = useState<LocalAgentInfo[]>([]);
  const [localAgentsErr, setLocalAgentsErr] = useState('');
  const [enabling, setEnabling] = useState('');
  // 每个本机 agent 行上选中的模型（'' = 用该家默认）。
  const [laModels, setLaModels] = useState<Record<string, string>>({});
  const [localAgentNote, setLocalAgentNote] = useState('');

  // 拉取模型列表：{ 通道#行号 → { loading, models, err } }。结果按 baseUrl 落 localStorage（7 天过期），
  // 刷新页面/重开设置不用重新拉。
  // 键必须带通道前缀：六个通道共用 renderBoard，裸行号会让「对话」通道拉到的
  // 模型列表串到「生图」同名行上（下拉可选到另一个 provider 的模型）。
  const [modelLists, setModelLists] = useState<Record<string, { loading: boolean; models: string[]; err: string; fetchedAt?: number }>>({});
  // localStorage 里按 baseUrl 存的拉取结果（7 天过期），初始化时一次性读入。
  const [modelCache, setModelCache] = useState<Record<string, { models: string[]; fetchedAt: number }>>(() => {
    try {
      const raw = localStorage.getItem('easel_model_lists');
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  });
  // 自定义下拉面板的展开状态与收起检测（键同样带通道前缀，见 modelLists）
  const [openDd, setOpenDd] = useState<Record<string, boolean>>({});
  const [protoDd, setProtoDd] = useState<Record<string, boolean>>({});
  const protoRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const modelCellRefs = useRef<Record<string, HTMLSpanElement | null>>({});

  useEffect(() => {
    if (harness !== 'openclaw') return;
    let alive = true;
    fetchWithRetry(() => fetchLocalAgents(), 3, 10000)
      .then((d) => { if (alive) setLocalAgents(d.agents || []); })
      .catch((e) => { if (alive) setLocalAgentsErr(e instanceof Error ? e.message : 'Erkennung fehlgeschlagen'); });
    return () => { alive = false; };
  }, [harness]);

  const doEnableAgent = useCallback(async (id: string, model = '') => {
    setEnabling(id);
    setLocalAgentNote('');
    try {
      const d = await enableLocalAgent(id, model);
      setLocalAgentNote(d.note || 'Verbunden');
      setLocalAgents((as) => as.map((a) => (a.id === id ? { ...a, configured: true } : a)));
    } catch (e) {
      setLocalAgentNote(e instanceof Error ? e.message : 'Verbindung fehlgeschlagen');
    } finally {
      setEnabling('');
    }
  }, []);

  const pullModels = useCallback(async (key: string, r: ModelRow) => {
    setModelLists((m) => ({ ...m, [key]: { loading: true, models: m[key]?.models || [], err: '' } }));
    try {
      const proto = r.slot === 'custom' ? (r.protocol || 'openai') : (r.type === 'anthropic' ? 'anthropic' : 'openai');
      const d = await fetchAvailableModels(r.baseUrl || '', r.keyNew || '', proto, r.slot || '', r.name || '');
      const fetchedAt = Date.now();
      setModelLists((m) => ({ ...m, [key]: { loading: false, models: d.models, err: d.models.length ? '' : 'Dieser Endpunkt liefert keine Modelle', fetchedAt } }));
      if (d.models.length) {
        setModelCache((c) => {
          const next = { ...c, [cacheKeyFor(r)]: { models: d.models, fetchedAt } };
          try { localStorage.setItem('easel_model_lists', JSON.stringify(next)); } catch { /* 忽略 */ }
          return next;
        });
      }
    } catch (e) {
      setModelLists((m) => ({ ...m, [key]: { loading: false, models: m[key]?.models || [], err: e instanceof Error ? e.message : 'Abruf fehlgeschlagen' } }));
    }
  }, []);

  useEffect(() => {
    let alive = true;
    if (!harness) return;
    setModelLoading(true);
    const configuration = selectedHarness === 'api' || selectedHarness === 'openclaw' ? selectedHarness : undefined;
    fetchWithRetry(() => fetchModelChannels(configuration), 5, 15000)
      .then((d) => {
        if (!alive) return;
        setChatRows(d.channels.chat.rows || []);
        setTransRows(d.channels.transcribe.rows || []);
        setMediaRows({
          image: d.channels.image?.rows || [],
          video: d.channels.video?.rows || [],
          music: d.channels.music?.rows || [],
          speech: d.channels.speech?.rows || [],
        });
        setModelErr('');
      })
      .catch((e) => { if (alive) setModelErr(e instanceof Error ? e.message : 'Modellkonfiguration konnte nicht gelesen werden'); })
      .finally(() => { if (alive) setModelLoading(false); });
    return () => { alive = false; };
  }, [harness, selectedHarness]);

  const doSelftest = useCallback(async (channel: string) => {
    setTesting(true);
    setSelftestNote('');
    try {
      const r = await runChannelSelftest(channel);
      const byBase: Record<string, SelftestResult> = {};
      r.results.forEach((x) => { byBase[x.baseUrl] = x; });
      setSelftest({ testedAt: r.testedAt, byBase });
      if (!r.results.length) setSelftestNote('Kein Kanal zum Testen (kein Schlüssel eingetragen)');
      void refreshEnv();
    } catch (e) {
      setSelftestNote(e instanceof Error ? `Test fehlgeschlagen: ${e.message}` : 'Test fehlgeschlagen');
    } finally {
      setTesting(false);
    }
  }, [refreshEnv]);

  // ── 模型配置可编辑（v2）：保存到 .env / openclaw ──────────
  const [saving, setSaving] = useState(false);
  const [savedNote, setSavedNote] = useState('');

  const saveCurrent = useCallback(async () => {
    const rows = chan === 'chat' ? chatRows : chan === 'transcribe' ? transRows : (mediaRows[chan] || []);
    const payload = rows
      .filter((r) => r.slot)
      .map((r) => ({
        slot: r.slot as string,
        name: r.slot === 'custom' ? r.name.trim().toLowerCase() : '',
        // 后端在这些字段里塞的是展示占位（'官方'/'（未配置）'/'本机'/'—'），不是真值：
        // 原样回传会被后端的 Base URL 校验打成 400，导致该行永远保存不了。
        model: PLACEHOLDERS.has(r.model) ? '' : r.model,
        baseUrl: PLACEHOLDERS.has(r.baseUrl) ? '' : r.baseUrl,
        key: r.keyNew || '',
        key2: r.keyNew2 || '',
        primary: r.role === '主',
        // 协议只对自定义供应商有意义；其余行后端不读这个字段
        protocol: r.slot === 'custom' ? (r.protocol || 'openai') : undefined,
        thinking: r.slot === 'custom' ? r.thinking : undefined,
        thinkingFormat: r.slot === 'custom' && r.thinking && r.protocol !== 'anthropic'
          ? (r.thinkingFormat || undefined) : undefined,
      }));
    if (!payload.length) {
      setSavedNote('Für diesen Kanal gibt es nichts zu speichern');
      return;
    }
    setSaving(true);
    setSavedNote('');
    try {
      const d = await fetchWithRetry(() => saveModelConfig(chan, payload), 3, 20000);
      setChatRows(d.channels.chat.rows || []);
      setTransRows(d.channels.transcribe.rows || []);
      setMediaRows({
        image: d.channels.image?.rows || [],
        video: d.channels.video?.rows || [],
        music: d.channels.music?.rows || [],
        speech: d.channels.speech?.rows || [],
      });
      setSavedNote(d.note ? `✓ Gespeichert (${d.note})` : '✓ Gespeichert');
      void refreshEnv();
    } catch (e) {
      setSavedNote(e instanceof Error ? `Speichern fehlgeschlagen: ${e.message}` : 'Speichern fehlgeschlagen');
    } finally {
      setSaving(false);
      setTimeout(() => setSavedNote(''), 6000);
    }
  }, [chan, chatRows, transRows, mediaRows, refreshEnv]);

  // Esc 关闭
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // 本地兜底 whisper：从环境工具状态推出来（fw + 模型都在才算就绪）
  const fw = tools.find((t) => t.id === 'fw');
  const modelTool = tools.find((t) => t.id === 'model');
  const localReady = fw?.state === 'ok' && modelTool?.state === 'ok';
  const localRow: ModelRow = {
    order: 2, name: 'local-whisper', sub: 'Lokaler Ersatz · ohne Schlüssel', type: 'local',
    model: 'faster-whisper', baseUrl: '本机', keyMasked: '—', role: '备',
    result: localReady ? '✓ Bereit' : (tools.length ? 'Nicht installiert (unter „Umgebung“ installieren)' : 'Wird geprüft …'),
  };

  const resultText = (row: ModelRow): { text: string; cls: string } => {
    const st = row.baseUrl && row.baseUrl !== '—' ? selftest?.byBase[row.baseUrl] : undefined;
    if (st) return st.ok ? { text: `✓ ${st.ms}ms`, cls: 'good' } : { text: `✗ ${(st.detail || 'Fehler').slice(0, 42)}`, cls: 'bad' };
    if (row.result.includes('已就绪') || row.result.includes('已配置')) return { text: zh(row.result), cls: 'good' };
    if (row.result.includes('缺') || row.result.includes('未装')) return { text: zh(row.result), cls: 'warn-text' };
    return { text: zh(row.result), cls: '' };
  };

  const SLOT_EDIT: Record<string, { model: boolean; base: boolean }> = {
    'direct-api': { model: true, base: true },
    openai: { model: true, base: true },
    relay: { model: true, base: true },
    // anthropic 也要能改 Base URL：官方直连之外，中转站/自建网关/兼容代理都靠它
    // （后端 _SLOT_ENV_KEYS 已含 anthropic，改地址必须重填 Key 那道闸同样生效）。
    anthropic: { model: true, base: true },
    siliconflow: { model: false, base: true },
    custom: { model: true, base: true },
  };

  const addProvider = () => {
    setChatRows((rs) => [...rs, {
      slot: 'custom', order: 0, name: '', sub: 'Eigene', type: 'openai',
      model: '', baseUrl: '', keyMasked: '', role: '备', result: 'Noch nicht gespeichert',
      thinking: false, thinkingFormat: 'openai',
    }]);
  };

  const setPrimaryRow = (i: number) =>
    setChatRows((rs) => rs.map((r, j) => (r.slot ? { ...r, role: j === i ? '主' : '备' } : r)));

  const removeRow = (i: number) => {
    // 删行后整体索引前移一位：把该通道的会话态键同步平移，
    // 否则「已拉取/错误」标记会错挂到别行上。localStorage 缓存按 baseUrl，不受影响。
    const shiftBoardKeys = (board: string) => {
      const prefix = `${board}#`;
      const shift = <T,>(rec: Record<string, T>): Record<string, T> => {
        const next: Record<string, T> = {};
        for (const [key, val] of Object.entries(rec)) {
          if (!key.startsWith(prefix)) { next[key] = val; continue; }
          const idx = Number(key.slice(prefix.length));
          if (Number.isNaN(idx)) { next[key] = val; continue; }
          if (idx === i) continue;                 // 被删行的状态随之丢弃
          next[prefix + (idx > i ? idx - 1 : idx)] = val;
        }
        return next;
      };
      setModelLists(shift);
      setOpenDd(shift);
      setProtoDd(shift);
    };
    shiftBoardKeys('chat');
    setChatRows((rs) => {
      const gone = rs[i];
      const left = rs.filter((_, j) => j !== i);
      if (gone && gone.role === '主') {
        const first = left.findIndex((r) => r.slot);
        if (first >= 0) left[first] = { ...left[first], role: '主' };
      }
      return left;
    });
  };

  const updateRow = (
    setRows: Dispatch<SetStateAction<ModelRow[]>>,
    i: number,
    patch: Partial<ModelRow>,
  ) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  const updateMediaRow = (ch: string, i: number, patch: Partial<ModelRow>) =>
    setMediaRows((m) => ({ ...m, [ch]: (m[ch] || []).map((r, j) => (j === i ? { ...r, ...patch } : r)) }));

  const setMediaPrimary = (ch: string, i: number) =>
    setMediaRows((m) => ({ ...m, [ch]: (m[ch] || []).map((r, j) => ({ ...r, role: j === i ? '主' : '备' })) }));

  const mediaOk = (ch: string) => (mediaRows[ch] || []).some((r) => r.result === '已配置');

  const cacheKeyFor = (r: ModelRow) => {
    const base = (r.baseUrl || '').trim().replace(/\/+$/, '');
    if (!base) return '';
    return `${base}::${r.slot === 'custom' ? (r.protocol || 'openai') : (r.type === 'anthropic' ? 'anthropic' : 'openai')}`;
  };

  const cachedListFor = (r: ModelRow) => {
    const key = cacheKeyFor(r);
    if (!key) return undefined;
    const hit = modelCache[key];
    const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
    return hit && hit.fetchedAt > weekAgo && hit.models.length ? hit : undefined;
  };

  const renderBoard = (
    rows: ModelRow[],
    ops?: { onRow?: (i: number, patch: Partial<ModelRow>) => void; onPrimary?: (i: number) => void; onRemove?: (i: number) => void; media?: boolean },
    board = 'chat',
  ) => {
    // 每行的会话态键：通道#行号 —— 不同通道/删除行后错位不再互相污染（见 modelLists 注释）
    const k = (i: number) => `${board}#${i}`;
    return (
    modelLoading && rows.length === 0 ? (
      <div className="board"><div className="empty"><span className="spin" /> Konfiguration wird geladen …<span className="hint">(bei hoher Last etwas langsamer, wird automatisch wiederholt)</span></div></div>
    ) : rows.length === 0 ? (
      <div className="board"><div className="empty">Noch nichts eingerichtet.<span className="hint">Lokale Funktionen lassen sich unter „Umgebung“ ergänzen.</span></div></div>
    ) : (
      <div className="board">
        <div className="prow head">
          <span>Nr.</span><span>Anbieter</span><span>Typ</span><span>Modell</span>
          <span>Base URL</span><span>API Key</span><span>Rolle</span><span>Letztes Ergebnis</span>
          <span />
        </div>
        {rows.map((r, i) => {
          const rt = resultText(r);
          const ed = SLOT_EDIT[r.slot || '']
            || (ops?.media && r.slot
              ? { model: r.modelEditable !== false, base: r.baseEditable !== false }
              : undefined);
          const isCustom = r.slot === 'custom';
          return (
            <div className="prow" key={i}>
              <span className={`step${r.order === 0 ? ' ghost' : ''}`}>{isCustom ? i + 1 : r.order}</span>
              {isCustom ? (
                <span className="pname">
                  <input
                    className="mock"
                    value={r.name}
                    placeholder="Name"
                    onChange={(e) => ops?.onRow?.(i, { name: e.target.value.toLowerCase() })}
                  />
                </span>
              ) : (
                <span className="pname">{zh(r.name)}<small>{zh(r.sub)}</small></span>
              )}
              {isCustom && ed && ed.base ? (
                <span
                  className="proto-trigger"
                  role="button"
                  tabIndex={0}
                  aria-haspopup="listbox"
                  aria-expanded={!!protoDd[k(i)]}
                  ref={(el) => { protoRefs.current[k(i)] = el; }}
                  title="Protokoll: OpenAI-kompatible Zwischenstelle → openai; natives Anthropic-Format (/v1/messages) → anthropic"
                  onClick={() => setProtoDd((s) => ({ ...s, [k(i)]: !s[k(i)] }))}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setProtoDd((state) => ({ ...state, [k(i)]: !state[k(i)] }));
                    }
                  }}
                >
                  <span className="proto-label">{r.protocol === 'anthropic' ? 'anthropic' : 'openai'}</span>
                  {protoDd[k(i)] && (
                    <OptionsDropdown
                      anchor={protoRefs.current[k(i)]}
                      items={[{ value: 'openai', label: 'openai (OpenAI-kompatibel)' }, { value: 'anthropic', label: 'anthropic (nativ /v1/messages)' }]}
                      current={r.protocol || 'openai'}
                      onPick={(v) => {
                        ops?.onRow?.(i, { protocol: v });
                        // 协议变了，旧协议拉来的模型列表不再适用：清内存列表 + 收起
                        setModelLists((m) => {
                          const next = { ...m };
                          delete next[k(i)];
                          return next;
                        });
                        setProtoDd((s) => ({ ...s, [k(i)]: false }));
                        setOpenDd((state) => ({ ...state, [k(i)]: false }));
                      }}
                      onClose={() => setProtoDd((s) => ({ ...s, [k(i)]: false }))}
                    />
                  )}
                </span>
              ) : isCustom ? (
                <span title="Protokoll nach dem Speichern änderbar">{r.protocol === 'anthropic' ? 'anthropic' : 'openai'}</span>
              ) : (
                <span>{zh(r.type)}</span>
              )}
              {ed && ed.model && (!ops?.media || r.adv) ? (
                <span className={`model-cell${isCustom ? ' custom-model-cell' : ''}`} ref={(el) => { modelCellRefs.current[k(i)] = el; }}>
                  <input
                    className="mock"
                    value={r.model}
                    placeholder={isCustom ? 'Modellname' : ''}
                    onChange={(e) => ops?.onRow?.(i, { model: e.target.value })}
                    onFocus={() => setOpenDd((s) => ({ ...s, [k(i)]: true }))}
                  />
                  {openDd[k(i)] ? (
                    <FixedDropdown
                      anchor={modelCellRefs.current[k(i)]}
                      models={modelLists[k(i)]?.models.length ? modelLists[k(i)].models : (cachedListFor(r)?.models || [])}
                      current={r.model}
                      emptyHint={modelLists[k(i)]?.err || undefined}
                      onPull={() => void pullModels(k(i), r)}
                      pulling={modelLists[k(i)]?.loading}
                      onPick={(mid) => { ops?.onRow?.(i, { model: mid }); setOpenDd((s) => ({ ...s, [k(i)]: false })); }}
                      onClose={() => setOpenDd((s) => ({ ...s, [k(i)]: false }))}
                    />
                  ) : null}
                  {(() => {
                    const mem = modelLists[k(i)];
                    const cached = mem?.fetchedAt ? undefined : cachedListFor(r);
                    const has = !!(mem?.fetchedAt || cached);
                    return (
                      <button
                        className={`fetch-btn${has ? ' ok' : ''}`}
                        title={has ? `Abgerufen: ${(mem?.models.length || cached!.models.length)} Modelle, klicken für neuen Abruf` : 'Verfügbare Modelle von diesem Endpunkt abrufen'}
                        onClick={() => {
                          setOpenDd((s) => ({ ...s, [k(i)]: true }));
                          void pullModels(k(i), r);
                        }}
                        disabled={mem?.loading}
                      >
                        {mem?.loading
                          ? <><span className="spin" />Wird abgerufen</>
                          : has
                            ? <span title={`Abgerufen: ${(mem?.models.length || cached!.models.length)} Modelle, im Eingabefeld auswählen`}>✓</span>
                            : 'Modelle abrufen'}
                      </button>
                    );
                  })()}
                  {modelLists[k(i)]?.err && (
                    <span className="fetch-err" title={modelLists[k(i)].err}>⚠</span>
                  )}
                  {isCustom ? (
                    <span className="thinking-controls">
                      <label title="Nur einschalten, wenn das Modell Reasoning unterstützt; das Format muss zur Schnittstelle des Anbieters passen">
                        <input
                          type="checkbox"
                          checked={r.thinking === true}
                          onChange={(e) => ops?.onRow?.(i, { thinking: e.target.checked })}
                        />
                        Modell denkt nach (Reasoning)
                      </label>
                      {r.thinking && r.protocol !== 'anthropic' ? (
                        <SettingsSelect label={`${r.name || 'Eigener Anbieter'}Reasoning-Format`}
                          value={r.thinkingFormat || ''}
                          options={[{ value: '', label: 'Beibehalten / automatisch' },
                            ...['OpenAI', 'DeepSeek', 'OpenRouter', 'Together', 'Qwen', 'Qwen chat template', 'ZAI'].map((label, i) => ({
                              label, value: ['openai', 'deepseek', 'openrouter', 'together', 'qwen', 'qwen-chat-template', 'zai'][i],
                            }))]}
                          onChange={(value) => ops?.onRow?.(i, { thinkingFormat: value })} />
                      ) : null}
                    </span>
                  ) : null}
                </span>
              ) : (
                <span className={`cell-text${ops?.media && !r.model ? ' dim' : ''}`} title={zh(r.model) || 'Standard (eingebaut)'}>
                  {zh(r.model) || (ops?.media ? 'Standard (eingebaut)' : '')}
                </span>
              )}
              {ed && ed.base && (!ops?.media || r.adv) ? (
                <input className="mock" value={r.baseUrl} placeholder="https://…" onChange={(e) => ops?.onRow?.(i, { baseUrl: e.target.value })} />
              ) : (
                <span className={`cell-text${ops?.media && !r.baseUrl ? ' dim' : ''}`} title={zh(r.baseUrl) || 'Standard (eingebaut)'}>
                  {zh(r.baseUrl)
                    || (ops?.media
                      ? r.baseOptional === false
                        ? 'Angabe nötig (unter „Erweitert“)'
                        : 'Standard (eingebaut)'
                      : '')}
                </span>
              )}
              {ed ? (
                r.key2Label ? (
                  <span className="key-stack">
                    <input
                      className="mock key-input"
                      type="password"
                      value={r.keyNew || ''}
                      placeholder={zh(r.keyMasked) || 'Key'}
                      onChange={(e) => ops?.onRow?.(i, { keyNew: e.target.value })}
                    />
                    <input
                      className="mock key-input"
                      type="password"
                      value={r.keyNew2 || ''}
                      placeholder={r.key2Masked || r.key2Label}
                      onChange={(e) => ops?.onRow?.(i, { keyNew2: e.target.value })}
                    />
                  </span>
                ) : (
                  <input
                    className="mock key-input"
                    type="password"
                    value={r.keyNew || ''}
                    placeholder={zh(r.keyMasked) || 'Schlüssel einfügen'}
                    onChange={(e) => ops?.onRow?.(i, { keyNew: e.target.value })}
                  />
                )
              ) : (
                <span className="cell-text key-mask" title="Schlüssel wird nicht im Klartext angezeigt">{zh(r.keyMasked) || '—'}</span>
              )}
              {r.slot && ops?.onPrimary ? (
                <button
                  className={`tag ${r.role === '主' ? 'main' : 'backup'}`}
                  onClick={() => ops.onPrimary?.(i)}
                  title="Als Hauptkanal setzen"
                >
                  {r.role === '主' ? 'Haupt' : 'Ersatz'}
                </button>
              ) : (
                <span className={`tag ${r.role === '主' ? 'main' : 'backup'}`}>{r.role === '主' ? 'Haupt' : 'Ersatz'}</span>
              )}
              <span className={`stt ${rt.cls}`}>{rt.text}</span>
              {isCustom && ops?.onRemove ? (
                <button className="row-del" onClick={() => ops.onRemove?.(i)} title="Anbieter entfernen">✕</button>
              ) : ops?.media && r.slot ? (
                <button className="adv-btn" onClick={() => ops?.onRow?.(i, { adv: !r.adv })}>
                  {r.adv ? 'Einklappen' : 'Erweitert'}
                </button>
              ) : (
                <span />
              )}
            </div>
          );
        })}
      </div>
    )
    );
  };

  const chatOk = chatRows.length > 0 && !chatRows[0].result.includes('缺');
  const transOk = transRows.length > 1 && transRows[1].result.includes('已配置');

  return (
    <div
      className="settings-overlay"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="settings-panel" role="dialog" aria-modal="true" aria-label="Einstellungen">
        <div className="settings-head">
          <div>
            <h2 className="settings-title">Einstellungen</h2>
            <div className="settings-sub">Modelle · Umgebung · Weitere Einstellungen</div>
          </div>
          <div className="settings-actions">
            <button
              className="btn btn-sm btn-primary"
              onClick={() => void saveCurrent()}
              disabled={saving || modelLoading || sec !== 'model' || (chan === 'chat' && (selectedHarness !== harness || !['api', 'openclaw'].includes(harness)))}
              title={chan === 'chat' && !['api', 'openclaw'].includes(harness) ? 'Bitte unten mit „Engine speichern“ die native Konfiguration speichern' : undefined}
            >
              {saving ? 'Wird gespeichert …' : 'Speichern'}
            </button>
            <button
              className="btn btn-sm"
              onClick={() => void doSelftest(sec === 'model' ? chan : 'all')}
              disabled={testing || modelLoading || selectedHarness !== harness || (!['api', 'openclaw'].includes(harness) && (sec !== 'model' || chan === 'chat'))}
              title={!['api', 'openclaw'].includes(harness) ? 'Für native Engines eine Nachricht senden oder easel ping ausführen' : undefined}
            >
              {testing ? 'Wird getestet …' : 'Alle testen'}
            </button>
            <button className="settings-close" onClick={onClose} title="Schließen (Esc)">✕</button>
          </div>
        </div>

        {banner && (
          <div
            role="status"
            style={{
              margin: '0 16px 12px', padding: '10px 12px', borderRadius: 8,
              background: 'var(--warn-bg, #fff7ed)', color: 'var(--warn-fg, #9a3412)',
              border: '1px solid var(--warn-border, #fed7aa)', fontSize: 13, lineHeight: 1.5,
            }}
          >
            {banner}
          </div>
        )}

        <div className="settings-body">
          <nav className="settings-nav">
            <button className={`snav${sec === 'model' ? ' active' : ''}`} onClick={() => setSec('model')}>
              <IconSlidersHorizontal size={16} />Modelle<small>Sechs Kanäle</small>
            </button>
            <button className={`snav${sec === 'env' ? ' active' : ''}`} onClick={() => setSec('env')}>
              <IconPackage size={16} />Umgebung<small>{total ? (okCount === total ? 'Alles bereit' : `${okCount}/${total}`) : '…'}</small>
            </button>
            <button className={`snav${sec === 'more' ? ' active' : ''}`} onClick={() => setSec('more')}>
              <IconEllipsis size={16} />Weitere Einstellungen
            </button>
          </nav>

          <div className="settings-main">
            {sec === 'model' && (
              <section className="st-sec active">
                <div className="tabbar">
                  {CHANNELS.map((c) => (
                    <button key={c.id} className={`tab${chan === c.id ? ' active' : ''}`} onClick={() => setChan(c.id)}>
                      <span className="cdot" />{c.label}
                    </button>
                  ))}
                </div>
                {savedNote ? <div className={`save-note${/^(保存失败|没有|Speichern fehlgeschlagen|Kein|Für diesen Kanal)/.test(savedNote) ? ' err' : ''}`}>{savedNote}</div> : null}

                {chan === 'chat' && <HarnessSettings onChange={setHarness} onSelect={setSelectedHarness} />}
                {chan === 'chat' && (selectedHarness === 'api' || selectedHarness === 'openclaw') && (
                  <section className="st-panel active">
                    <div className="panel-top">
                      <strong>{selectedHarness === 'api' ? 'API für den Nur-Chat-Modus' : 'OpenClaw-API'}</strong>
                      <span className={`pill ${chatOk ? 'ok' : 'off'}`}><span className="dot" />{chatOk ? 'Eingerichtet' : 'Nicht eingerichtet'}</span>
                      {selftest && <span className="desc">Letzter Test {hhmm(selftest.testedAt)}</span>}
                      <span className="spacer" />
                      <button className="btn btn-sm" onClick={() => void doSelftest('chat')} disabled={testing || selectedHarness !== harness}>Diesen Kanal testen</button>
                    </div>
                    {renderBoard(chatRows, { onRow: (i, p) => updateRow(setChatRows, i, p), onPrimary: setPrimaryRow, onRemove: removeRow }, 'chat')}
                    {selectedHarness === 'api' ? <div className="foot-note">Dieser Kanal nutzt eine eigene EASEL_DIRECT_API_*-Konfiguration, getrennt vom bisherigen OpenAI-Kanal. Unterstützt Chat, Profile, Text- und Bildanhänge (wenn das Modell Bilder kann). Keine Werkzeuge für lokale Dateien, Browser oder Skills.</div>
                      : <div className="add-row" onClick={addProvider}>+ Anbieter hinzufügen (Name / Modell / Base-URL / Schlüssel; „Als Haupt“ wechselt den aktiven Kanal)</div>}
                    {harness === 'openclaw' && (() => {
                      // 本机 agent 区块：装了 Claude Code / Gemini CLI 并登录过的用户不需要填 API Key。
                      // 只展示「已装」的行 —— 没装的用户看一眼全是灰的只会困惑。
                      const shown = localAgents.filter((a) => a.installed);
                      if (localAgentsErr) return <div className="foot-note">Erkennung lokaler Agents fehlgeschlagen: {localAgentsErr}</div>;
                      if (!shown.length) return null;
                      const usable = shown.filter((a) => a.supported);
                      return (
                        <div className="local-agents">
                          <div className="la-head">
                            Lokaler Agent
                            <span className="desc">
                              {usable.length
                                ? `Ohne API-Schlüssel nutzbar erkannt: ${usable.map((a) => a.label).join(', ')}`
                                : 'Für das erkannte CLI gibt es noch kein Engine-Backend; API-Schlüssel weiterhin nötig'}
                            </span>
                          </div>
                          {shown.map((a) => (
                            <div className="la-row" key={a.id}>
                              <span className="la-name">{a.label}<small>{a.path || a.command}</small></span>
                              <span className={`la-state ${a.configured ? 'ok' : a.supported ? 'todo' : 'na'}`}>
                                {a.configured ? 'Verbunden' : a.supported ? 'Verfügbar' : 'Noch nicht unterstützt'}
                              </span>
                              <span className="la-act">
                                {a.supported && (a.models?.length ?? 0) > 0 && (
                                  <SettingsSelect className="la-model" label={`${a.label}Modell`}
                                    value={laModels[a.id] ?? ''}
                                    options={[{ value: '', label: 'Standardmodell' },
                                      ...(a.models ?? []).map(m => ({ value: m.id, label: m.name }))]}
                                    onChange={(value) => setLaModels(m => ({ ...m, [a.id]: value }))} />
                                )}
                                {a.supported && (
                                  <button
                                    className="btn btn-sm"
                                    disabled={enabling === a.id}
                                    title={a.configured ? 'Gewähltes Modell erneut anwenden (Hauptmodell in openclaw.json)' : 'In openclaw.json eintragen, ohne API-Schlüssel nutzen'}
                                    onClick={() => void doEnableAgent(a.id, laModels[a.id] ?? '')}
                                  >{enabling === a.id ? 'Wird verbunden …' : a.configured ? 'Modell anwenden' : 'Verbinden'}</button>
                                )}
                              </span>
                              <span className="la-hint">{a.loginHint}</span>
                            </div>
                          ))}
                          {localAgentNote && <div className="foot-note">{localAgentNote}</div>}
                        </div>
                      );
                    })()}
                    <div className="foot-note">Nach Änderungen oben rechts „Speichern“ klicken (Schlüssel leer = unverändert); automatische Ausweichketten folgen mit dem gemeinsamen Gateway.</div>
                  </section>
                )}

                {chan === 'transcribe' && (
                  <section className="st-panel active">
                    <div className="panel-top">
                      <span className={`pill ${transOk ? 'ok' : 'warn'}`}><span className="dot" />{transOk ? 'Hauptkanal online' : (localReady ? 'Lokaler Ersatz aktiv' : 'Ersatz noch nicht installiert')}</span>
                      <span className="desc">Drei Stufen: vorhandene Untertitel → API → lokaler Ersatz</span>
                      <span className="spacer" />
                      <button className="btn btn-sm" onClick={() => void doSelftest('transcribe')} disabled={testing}>Diesen Kanal testen</button>
                    </div>
                    {renderBoard([...transRows, localRow], { onRow: (i, p) => updateRow(setTransRows, i, p) }, 'transcribe')}
                    <div className="foot-note">Mit vorhandenen Untertiteln wird kein Modell geladen; fehlt der API-Schlüssel, übernimmt lokales Whisper (unter „Umgebung“ installieren). Speichern schreibt in .env.</div>
                  </section>
                )}

                {chan === 'speech' && (
                  <section className="st-panel active">
                    <div className="panel-top">
                      <span className={`pill ${mediaOk('speech') ? 'ok' : 'off'}`}><span className="dot" />{mediaOk('speech') ? 'Anbieter verfügbar' : 'Nicht eingerichtet'}</span>
                      <span className="desc">Nur Schlüssel eintragen (Adresse/Modell eingebaut); „Haupt/Ersatz“ = Standard</span>
                      <span className="spacer" />
                    </div>
                    {renderBoard(mediaRows.speech || [], { onRow: (i, p) => updateMediaRow('speech', i, p), onPrimary: (i) => setMediaPrimary('speech', i), media: true }, 'speech')}
                    <div className="foot-note">Vertonung nutzt den „Haupt“-Anbieter; lokales VoxCPM / edge-tts kann in der Video-Pipeline direkt einspringen.</div>
                  </section>
                )}

                {chan === 'image' && (
                  <section className="st-panel active">
                    <div className="panel-top">
                      <span className={`pill ${mediaOk('image') ? 'ok' : 'off'}`}><span className="dot" />{mediaOk('image') ? 'Eingerichtet' : 'Nicht eingerichtet'}</span>
                      <span className="desc">Nur Schlüssel eintragen (Adresse/Modell eingebaut, unter „Erweitert“ änderbar)</span>
                      <span className="spacer" />
                    </div>
                    {renderBoard(mediaRows.image || [], { onRow: (i, p) => updateMediaRow('image', i, p), media: true }, 'image')}
                    <div className="foot-note">Synchron/asynchron (apimart) wird nach Base-URL gewählt; leerer Modellname = Standard des Dienstes.</div>
                  </section>
                )}

                {chan === 'video' && (
                  <section className="st-panel active">
                    <div className="panel-top">
                      <span className={`pill ${mediaOk('video') ? 'ok' : 'off'}`}><span className="dot" />{mediaOk('video') ? 'Anbieter verfügbar' : 'Nicht eingerichtet'}</span>
                      <span className="desc">Nur Schlüssel eintragen (Adresse/Modell eingebaut, unter „Erweitert“ änderbar); „Haupt/Ersatz“ = Standard</span>
                      <span className="spacer" />
                    </div>
                    {renderBoard(mediaRows.video || [], { onRow: (i, p) => updateMediaRow('video', i, p), onPrimary: (i) => setMediaPrimary('video', i), media: true }, 'video')}
                    <div className="foot-note">Skripte nutzen den „Haupt“-Anbieter; automatisches Ausweichen zwischen Anbietern folgt mit dem gemeinsamen Gateway.</div>
                  </section>
                )}

                {chan === 'music' && (
                  <section className="st-panel active">
                    <div className="panel-top">
                      <span className={`pill ${mediaOk('music') ? 'ok' : 'off'}`}><span className="dot" />{mediaOk('music') ? 'Anbieter verfügbar' : 'Nicht eingerichtet'}</span>
                      <span className="desc">Nur Schlüssel eintragen; „Haupt/Ersatz“ = Standard</span>
                      <span className="spacer" />
                    </div>
                    {renderBoard(mediaRows.music || [], { onRow: (i, p) => updateMediaRow('music', i, p), onPrimary: (i) => setMediaPrimary('music', i), media: true }, 'music')}
                  </section>
                )}

                {modelErr && <div className="env-error">{modelErr}</div>}
                {selftestNote && <div className="foot-note">{selftestNote}</div>}
              </section>
            )}

            {sec === 'env' && (
              <section className="st-sec active">
                <EnvBoard
                  tools={tools}
                  python={python}
                  loading={envLoading}
                  error={envError}
                  jobs={jobs}
                  anyRunning={anyRunning}
                  onRefresh={() => void refreshEnv(true)}
                  onInstall={installOne}
                  onInstallMany={installMany}
                />
              </section>
            )}

            {sec === 'more' && (
              <section className="st-sec active">
                <div className="panel-top">
                  <span className={`pill ${proxyCfg?.proxy ? 'ok' : 'off'}`}><span className="dot" />
                    {proxyCfg?.proxy ? 'Proxy eingerichtet' : 'Kein Proxy'}</span>
                  <span className="desc">Für Zugriffe auf X und andere Auslandsdienste; bestehende Proxy- und Direkt-Einstellungen bleiben erhalten</span>
                  <span className="spacer" />
                </div>
                <div className="board">
                  <div style={{ padding: 14 }}>
                    <label className="field-label" style={{ display: 'block', marginBottom: 6 }}>
                      Netzwerk-Proxy (EASEL_PROXY)
                    </label>
                    <input
                      className="field"
                      style={{ width: '100%', boxSizing: 'border-box' }}
                      value={proxyInput}
                      disabled={proxyCfg?.source === 'env' || proxyBusy}
                      onChange={(e) => { setProxyInput(e.target.value); setProxyErr(''); setProxyMsg(''); }}
                      placeholder="http://127.0.0.1:7890 oder socks5://127.0.0.1:1080"
                    />
                    {proxyCfg?.source === 'env' && (
                      <div className="foot-note" style={{ marginTop: 8 }}>
                        EASEL_PROXY ist in der Startumgebung fest gesetzt und hier nur lesbar; zum Ändern die Startumgebung anpassen und neu starten.
                      </div>
                    )}
                    {proxyErr && <div className="env-error" style={{ marginTop: 8 }}>{proxyErr}</div>}
                    {proxyMsg && <div className="foot-note" style={{ marginTop: 8 }}>{proxyMsg}</div>}
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <button
                        className="btn btn-sm btn-primary"
                        disabled={proxyBusy || proxyCfg?.source === 'env'}
                        onClick={() => void saveProxy()}
                      >
                        {proxyBusy ? 'Wird gespeichert …' : 'Speichern'}
                      </button>
                      {proxyCfg?.proxy && proxyCfg.source === 'envfile' && (
                        <button className="btn btn-sm btn-ghost" disabled={proxyBusy} onClick={clearProxy}>
                          Proxy entfernen
                        </button>
                      )}
                    </div>
                    <div className="foot-note" style={{ marginTop: 10 }}>
                      Gilt sofort nach dem Speichern (Login-/Posting-Prozesse lesen es bei jedem Start neu), kein Neustart nötig.
                      Aktuell: {proxyCfg?.proxy || '(nicht gesetzt, System-Proxy wird genutzt)'}
                    </div>
                  </div>
                  <div className="stub-row"><span className="tag2">Geplant</span>Allgemein (Sprache / Updates / Datenordner)<span className="future">Folgt bei Bedarf</span></div>
                </div>
              </section>
            )}
          </div>
        </div>

        <div className="settings-foot">
          {harness === 'api' || harness === 'openclaw'
            ? 'ⓘ Anbieter werden in .env gespeichert; die direkte API ist nur Chat ohne Werkzeuge. Nach Wechsel von Engine oder Chatmodus einen neuen Chat starten.'
            : 'ⓘ Native Agents verwalten ihre Anmeldung im eigenen CLI; „Engine speichern“ sichert nur Engine, Modellwahl und Rechte. Medienkanäle werden separat eingerichtet.'}
        </div>
      </div>
    </div>
  );
}


/** 模型下拉面板：portal 到 body + fixed 定位，避免被 board 的 overflow:hidden 裁切。 */
function FixedDropdown({ anchor, models, current, emptyHint, onPull, pulling, onPick, onClose }: {
  anchor: HTMLElement | null;
  models: string[];
  current: string;
  emptyHint?: string;
  onPull?: () => void;
  pulling?: boolean;
  onPick: (mid: string) => void;
  onClose: () => void;
}) {
  return (
    <OptionsDropdown
      anchor={anchor}
      items={models.map((m) => ({ value: m, label: m }))}
      current={current}
      emptyHint={emptyHint}
      onPull={onPull}
      pulling={pulling}
      onPick={onPick}
      onClose={onClose}
    />
  );
}

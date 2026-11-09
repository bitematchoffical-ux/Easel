import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchAccounts, startLogin, loginStatus, mediaUrl,
  accountWhoami, logoutAccount, submitLoginSms,
  saveCredentials, getCredentials, startMpLogin, mpLoginStatus,
} from '../lib/api';
import type { AccountItem, AccountWhoami } from '../lib/api';
import { getWhoamiCache, setWhoamiCache, verifyStale } from '../lib/whoami';

type QRState = {
  platform: string;
  name: string;
  state: string;       // starting | qr_ready | success | expired | error | unknown
  message: string;
  qr: string;          // outputs 相对路径
  qrTs?: number;       // 二维码文件 mtime，作 img 缓存键：码刷新一次就变，避免看到过期旧码
};

const STATE_LABEL: Record<string, string> = {
  starting: 'Startet …',
  qr_ready: 'Bitte QR-Code scannen',
  scanned: 'Scan erfolgreich',
  sms_required: 'SMS-Bestätigung nötig',
  verifying: 'Wird bestätigt …',
  window_login: 'Bitte im Browserfenster anmelden',
  success: 'Anmeldung erfolgreich ✅',
  expired: 'QR-Code abgelaufen',
  error: 'Anmeldefehler',
  unknown: 'Warten …',
};

/** 头像：有 URL 就显示图（加载失败退回首字），否则显示昵称/平台名首字。 */
function Avatar({ url, name }: { url?: string; name: string }) {
  const [broken, setBroken] = useState('');
  const initial = (name || '?').trim().charAt(0);
  if (url && broken !== url) {
    return <img className="account-avatar" src={url} alt={name}
      referrerPolicy="no-referrer" onError={() => setBroken(url)} />;
  }
  return <div className="account-avatar account-avatar-fallback">{initial}</div>;
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [err, setErr] = useState('');
  const [qr, setQr] = useState<QRState | null>(null);
  const [qrNonce, setQrNonce] = useState(0);   // 每次登录 +1，稳定缓存 key，避免每次轮询 img 闪烁
  const [terminalMsg, setTerminalMsg] = useState('');
  const [busy, setBusy] = useState('');
  const [logoutBusy, setLogoutBusy] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [smsBusy, setSmsBusy] = useState(false);
  const [smsErr, setSmsErr] = useState('');
  // whoami 结果缓存到 localStorage：打开页面秒显示昵称/头像，不必每次都起浏览器校验
  const [whoami, setWhoami] = useState<Record<string, AccountWhoami | 'loading'>>(() => getWhoamiCache());
  // 凭证式登录（微信公众号 AppID/AppSecret）
  const [cred, setCred] = useState<{ platform: string; name: string } | null>(null);
  const [credForm, setCredForm] = useState({ appId: '', appSecret: '', author: '' });
  const [credBusy, setCredBusy] = useState(false);
  const [credMsg, setCredMsg] = useState('');
  const [credErr, setCredErr] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const aliveRef = useRef(true);
  const qrPlatformRef = useRef('');   // 当前登录中的平台，供 submitSms 稳定引用
  const whoamiRequests = useRef<Record<string, number>>({});
  const qrRequest = useRef(0);

  useEffect(() => {
    aliveRef.current = true;
    return () => { aliveRef.current = false; qrRequest.current += 1; };
  }, []);

  // 真校验某平台登录态 + 拉昵称/头像（后端起浏览器，数秒）；手动「校验账号」或登录成功后调
  const runWhoami = useCallback((platform: string) => {
    const sequence = (whoamiRequests.current[platform] || 0) + 1;
    whoamiRequests.current[platform] = sequence;
    setWhoami((w) => ({ ...w, [platform]: 'loading' }));
    accountWhoami(platform, true)
      .then((r) => {
        if (aliveRef.current && whoamiRequests.current[platform] === sequence) {
          setWhoami((w) => ({ ...w, [platform]: r }));
          setWhoamiCache(platform, r);
          setAccounts((list) => list.map((account) =>
            account.platform === platform ? { ...account, loggedIn: r.loggedIn } : account));
        }
      })
      .catch(() => {
        if (aliveRef.current && whoamiRequests.current[platform] === sequence) {
          setWhoami((previous) => {
            const updated = { ...previous };
            const cached = getWhoamiCache()[platform];
            if (cached) updated[platform] = cached;
            else delete updated[platform];
            return updated;
          });
        }
      });
  }, []);

  // 打开页面：拉「快」状态（读 status.json，不起浏览器），随后后台自愈——对缓存缺失/过期的
  // 浏览器平台逐个真校验（whoami），结果到了刷新 UI，并令陈旧的假阴性缓存被真值覆盖。
  const load = useCallback(() => {
    setErr('');
    fetchAccounts()
      .then((list) => {
        if (!aliveRef.current) return;
        setAccounts(list);
        const targets = list
          .filter((a) => a.supported && a.backend !== 'biliup')
          .map((a) => a.platform);
        for (const account of list) {
          const cached = getWhoamiCache()[account.platform];
          if (cached && cached.loggedIn !== account.loggedIn) {
            setWhoamiCache(account.platform, null);
            setWhoami((previous) => {
              const updated = { ...previous };
              delete updated[account.platform];
              return updated;
            });
          }
        }
        verifyStale(targets, {
          alive: () => aliveRef.current,
          onUpdate: (platform, r) => {
            setWhoami((w) => ({ ...w, [platform]: r }));
            setAccounts((current) => current.map((account) =>
              account.platform === platform ? { ...account, loggedIn: r.loggedIn } : account));
          },
        });
      })
      .catch(() => setErr('Kontostatus konnte nicht geladen werden'));
  }, []);

  useEffect(() => { load(); }, [load]);

  // 切回本标签页 / 窗口重新获得焦点时自动重拉账号态——登录/退出后即使漏了一次刷新，切回来也是最新的，
  // 用户无需手动刷新页面。（登录中弹着二维码时不打扰，避免打断轮询。）
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === 'visible' && !pollRef.current) load(); };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [load]);

  const stopPoll = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  useEffect(() => () => stopPoll(), [stopPoll]);

  const closeQr = useCallback(() => {
    qrRequest.current += 1;
    stopPoll();
    setQr(null);
    setBusy('');
    setSmsCode(''); setSmsErr(''); setSmsBusy(false);
    load();
  }, [stopPoll, load]);

  const submitSms = useCallback(async () => {
    const code = smsCode.replace(/\D/g, '');
    if (code.length < 4) { setSmsErr('Bitte den Code aus der SMS eingeben'); return; }
    setSmsBusy(true); setSmsErr('');
    try {
      await submitLoginSms(qrPlatformRef.current, code);
      setSmsCode('');
      // 乐观切到「验证中」转圈：后端读走码→verifying；成功→success，失败→退回 sms_required 带错误
      setQr((prev) => prev && ({ ...prev, state: 'verifying', message: 'Code wird geprüft …' }));
      // 不停轮询：runner 读走验证码填码提交后，state 会转 success / 或退回 sms_required 重试
    } catch (e) {
      setSmsErr(e instanceof Error ? e.message : 'Code konnte nicht gesendet werden');
    } finally {
      setSmsBusy(false);
    }
  }, [smsCode]);

  // 凭证式（公众号）：打开 AppID/AppSecret 表单
  const openCred = useCallback((a: AccountItem) => {
    setCred({ platform: a.platform, name: a.name });
    setCredForm({ appId: '', appSecret: '', author: '' });
    setCredMsg(''); setCredErr('');
    getCredentials(a.platform)
      .then((c) => { if (aliveRef.current && c.configured) setCredMsg(`Eingerichtet: AppID ${c.appIdMasked}`); })
      .catch(() => { /* 未配置，忽略 */ });
  }, []);

  const closeCred = useCallback(() => { setCred(null); setCredBusy(false); load(); }, [load]);

  const submitCred = useCallback(async () => {
    if (!cred) return;
    const appId = credForm.appId.trim();
    const appSecret = credForm.appSecret.trim();
    if (!appId || !appSecret) { setCredErr('AppID und AppSecret sind beide nötig'); return; }
    setCredBusy(true); setCredErr(''); setCredMsg('');
    try {
      const r = await saveCredentials(cred.platform, { appId, appSecret, name: cred.name, author: credForm.author.trim() });
      if (r.ok) {
        runWhoami(cred.platform);
        closeCred();
      } else {
        setCredErr(r.message || 'Prüfung fehlgeschlagen');
      }
    } catch (e) {
      setCredErr(e instanceof Error ? e.message : 'Speichern fehlgeschlagen');
    } finally {
      setCredBusy(false);
    }
  }, [cred, credForm, runWhoami, closeCred]);

  const handleLogin = useCallback(async (a: AccountItem) => {
    if (!a.supported) return;
    if (a.backend === 'wechat-oa') { openCred(a); return; }   // 公众号走凭证表单，不扫码
    const sequence = ++qrRequest.current;
    stopPoll();
    setErr('');
    whoamiRequests.current[a.platform] = (whoamiRequests.current[a.platform] || 0) + 1;
    setWhoamiCache(a.platform, null);
    setTerminalMsg('');
    setBusy(a.platform);
    setSmsCode(''); setSmsErr('');
    qrPlatformRef.current = a.platform;
    setQrNonce((n) => n + 1);
    setQr({ platform: a.platform, name: a.name, state: 'starting',
            message: 'Browser wird gestartet, QR-Code wird vorbereitet …', qr: '' });
    try {
      const res = await startLogin(a.platform);
      if (!aliveRef.current || qrRequest.current !== sequence) return;
      if (res.mode === 'terminal') {
        setQr(null);
        setTerminalMsg(res.message || 'Bitte im Terminal anmelden');
        return;
      }
      if (res.mode === 'credentials') { setQr(null); openCred(a); return; }
      setQr({ platform: a.platform, name: a.name, state: res.state || 'starting',
              message: res.message || '', qr: res.qr || '', qrTs: res.qrTs });
      stopPoll();
      let polling = false;
      let finished = false;
      let failures = 0;
      const startedAt = Date.now();
      pollRef.current = setInterval(async () => {
        if (!aliveRef.current || qrRequest.current !== sequence || polling || finished) return;
        if (Date.now() - startedAt > 360000) {
          finished = true;
          stopPoll();
          setQr((previous) => previous && ({ ...previous, state: 'expired',
            message: 'Zeit für die Anmeldung abgelaufen, bitte schließen und neu anmelden', qr: '' }));
          return;
        }
        polling = true;
        try {
          const s = await loginStatus(a.platform);
          if (!aliveRef.current || qrRequest.current !== sequence) return;
          failures = 0;
          setQr((prev) => prev && ({ ...prev, state: s.state, message: s.message, qr: s.qr, qrTs: s.qrTs }));
          if (['success', 'expired', 'error'].includes(s.state)) {
            finished = true;
            stopPoll();
            if (s.state === 'success') {
              setAccounts((list) => list.map((account) =>
                account.platform === a.platform ? { ...account, loggedIn: true } : account));
              setWhoamiCache(a.platform, null);
              runWhoami(a.platform);
            }
          }
        } catch {
          if (!aliveRef.current || qrRequest.current !== sequence) return;
          failures += 1;
          if (failures >= 5) {
            finished = true;
            stopPoll();
            setQr((previous) => previous && ({ ...previous, state: 'error',
              message: 'Verbindung zum Anmeldestatus unterbrochen, bitte Netzwerk prüfen und neu anmelden', qr: '' }));
          }
        } finally {
          polling = false;
        }
      }, 1000);
    } catch (e) {
      if (!aliveRef.current || qrRequest.current !== sequence) return;
      const message = e instanceof Error ? e.message : 'Anmeldung konnte nicht gestartet werden';
      setQr((previous) => previous && ({ ...previous, state: 'error', message, qr: '' }));
    } finally {
      if (aliveRef.current && qrRequest.current === sequence) setBusy('');
    }
  }, [stopPoll, runWhoami, openCred]);

  // 公众号后台扫码登录（数据中心取数用，独立于 AppID 凭证）
  const handleMpLogin = useCallback(async (a: AccountItem) => {
    const sequence = ++qrRequest.current;
    stopPoll();
    setErr('');
    setBusy(a.platform + ':mp');
    setSmsCode(''); setSmsErr('');
    setQrNonce((n) => n + 1);
    setQr({ platform: a.platform, name: a.name + ' · Daten im Hintergrund', state: 'starting',
            message: 'Browser wird gestartet, QR-Code wird vorbereitet …', qr: '' });
    try {
      const res = await startMpLogin(a.platform);
      if (!aliveRef.current || qrRequest.current !== sequence) return;
      setQr({ platform: a.platform, name: a.name + ' · Daten im Hintergrund', state: res.state || 'starting',
              message: res.message || '', qr: res.qr || '', qrTs: res.qrTs });
      stopPoll();
      let polling = false;
      let finished = false;
      let failures = 0;
      const startedAt = Date.now();
      pollRef.current = setInterval(async () => {
        if (!aliveRef.current || qrRequest.current !== sequence || polling || finished) return;
        if (Date.now() - startedAt > 360000) {
          finished = true;
          stopPoll();
          setQr((previous) => previous && ({ ...previous, state: 'expired',
            message: 'Zeit für die Anmeldung abgelaufen, bitte schließen und neu anmelden', qr: '' }));
          return;
        }
        polling = true;
        try {
          const s = await mpLoginStatus(a.platform);
          if (!aliveRef.current || qrRequest.current !== sequence) return;
          failures = 0;
          setQr((prev) => prev && ({ ...prev, state: s.state, message: s.message, qr: s.qr, qrTs: s.qrTs }));
          if (['success', 'expired', 'error'].includes(s.state)) {
            finished = true;
            stopPoll();
            if (s.state === 'success') {
              // 像快手一样“内存态立即翻”：wechat-oa 的 effLoggedIn 只看 a.loggedIn，这里直接把它乐观置 true，
              // 卡片瞬间变「已登录」，不必等 load() 那趟网络往返（后面 load() 再对账兜底）。
              setAccounts((list) => list.map((x) => x.platform === a.platform ? { ...x, loggedIn: true } : x));
              setWhoami((w) => { const n = { ...w }; delete n[a.platform]; return n; });
              setWhoamiCache(a.platform, null);
              runWhoami(a.platform);
              load();
            }
          }
        } catch {
          if (!aliveRef.current || qrRequest.current !== sequence) return;
          failures += 1;
          if (failures >= 5) {
            finished = true;
            stopPoll();
            setQr((previous) => previous && ({ ...previous, state: 'error',
              message: 'Verbindung zum Anmeldestatus unterbrochen, bitte Netzwerk prüfen und neu anmelden', qr: '' }));
          }
        } finally {
          polling = false;
        }
      }, 1000);
    } catch (e) {
      if (!aliveRef.current || qrRequest.current !== sequence) return;
      const message = e instanceof Error ? e.message : 'Hintergrund-Anmeldung konnte nicht gestartet werden';
      setQr((previous) => previous && ({ ...previous, state: 'error', message, qr: '' }));
    } finally {
      if (aliveRef.current && qrRequest.current === sequence) setBusy('');
    }
  }, [stopPoll, runWhoami, load]);

  const handleLogout = useCallback(async (a: AccountItem) => {
    if (!window.confirm(`Wirklich von „${a.name}“ abmelden? Der Anmeldestatus wird gelöscht; zum nächsten Posten ist eine neue Anmeldung nötig.`)) return;
    setLogoutBusy(a.platform);
    try {
      await logoutAccount(a.platform);
      // 内存态立即翻未登录（同登录路径），不等 load() 回来
      setAccounts((list) => list.map((x) => x.platform === a.platform ? { ...x, loggedIn: false } : x));
      setWhoami((w) => { const n = { ...w }; delete n[a.platform]; return n; });
      setWhoamiCache(a.platform, null);
      load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Abmelden fehlgeschlagen');
    } finally {
      setLogoutBusy('');
    }
  }, [load]);

  // 卡片真实登录态：whoami 权威（已返回则以它为准，自愈假阳性），否则用后端 last-known。
  const effLoggedIn = (a: AccountItem): boolean => {
    const w = whoami[a.platform];
    if (w && w !== 'loading') return w.loggedIn;
    return a.loggedIn;
  };

  const badge = (a: AccountItem) => {
    if (!a.supported) return <span className="badge">Wird neu geschrieben</span>;
    if (whoami[a.platform] === 'loading') return <span className="badge">Wird geprüft …</span>;
    if (effLoggedIn(a)) return <span className="badge badge-ok">✓ Angemeldet</span>;
    return <span className="badge">Nicht angemeldet</span>;
  };

  return (
    <div className="accounts-page">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h1 className="page-title">Konten</h1>
          <p className="page-subtitle">
            Anmelden per App oder Browser; der Anmeldestatus wird lokal gespeichert, danach ist zum Posten keine erneute Anmeldung nötig.<br />
            ⚠️ Plattformen stufen Rechenzentrums- oder Proxy-IPs teils als riskant ein, dann erscheint kein Login. Nutze einen normalen Internetanschluss oder kopiere den Anmeldestatus von einem Rechner mit normalem Netz.
          </p>
        </div>
        <button className="btn btn-sm" onClick={load}>⟳ Aktualisieren</button>
      </div>

      {err && <div style={{ color: 'var(--red)', fontSize: 13, marginTop: 12 }}>{err}</div>}
      {terminalMsg && (
        <div className="card" style={{ padding: 13, fontSize: 13, marginTop: 14 }}>{terminalMsg}</div>
      )}

      <div className="accounts-grid">
        {accounts.map((a) => {
          const w = whoami[a.platform];
          const info = w && w !== 'loading' ? w : null;
          const logged = effLoggedIn(a);
          return (
            <div key={a.platform} className="card account-card" style={{ opacity: a.supported ? 1 : 0.6 }}>
              <div className="account-card-head">
                <span className="account-card-name">{a.name}</span>
                {badge(a)}
              </div>

              {logged && info && (
                <div className="account-identity">
                  <Avatar url={info.avatar} name={info.name || a.name} />
                  <span className="account-nick">{info.name || '(angemeldet)'}</span>
                </div>
              )}
              {!logged && (
                <div className="account-card-note">{a.note ? a.note : `Backend: ${a.name}`}</div>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                {logged ? (
                  <>
                    <button className="btn btn-sm" style={{ flex: 1 }}
                      disabled={busy === a.platform || busy === a.platform + ':mp' || w === 'loading'}
                      onClick={() => runWhoami(a.platform)}>
                      {w === 'loading' ? 'Wird geprüft …' : 'Konto prüfen'}
                    </button>
                    <button className="btn btn-sm btn-ghost" style={{ flex: 1 }}
                      disabled={logoutBusy === a.platform}
                      onClick={() => handleLogout(a)}>
                      {logoutBusy === a.platform ? 'Wird abgemeldet …' : 'Abmelden'}
                    </button>
                  </>
                ) : (
                  // 公众号与其它平台统一：都走扫码登录（公众号扫的是后台会话，用于发布+数据）
                  <button
                    className={`btn btn-block ${a.supported ? 'btn-primary' : ''}`}
                    disabled={!a.supported || busy === a.platform || busy === a.platform + ':mp'}
                    onClick={() => (a.backend === 'wechat-oa' ? handleMpLogin(a) : handleLogin(a))}>
                    {(busy === a.platform || busy === a.platform + ':mp') ? 'Startet …' : 'Anmelden'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {qr && (
        <div className="overlay" onClick={closeQr}>
          <div className="modal" style={{ width: 360, maxWidth: '100%', textAlign: 'center' }}
            onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 4px' }}>Anmelden {qr.name}</h3>
            <div style={{ fontSize: 13, marginBottom: 14,
              color: qr.state === 'success' ? 'var(--green)'
                : ['error', 'expired'].includes(qr.state) ? 'var(--red)' : 'var(--text-secondary)' }}>
              {/* 窗口登录（X）没有二维码，expired 表示「窗口登录超时」而非「二维码过期」 */}
              {(qr.state === 'expired' && !qr.qr ? 'Anmeldung abgelaufen/nicht abgeschlossen' : STATE_LABEL[qr.state]) || qr.state}
              {qr.message ? ` — ${qr.message}` : ''}
            </div>
            {qr.state === 'sms_required' ? (
              <div style={{ padding: '6px 4px 2px' }}>
                <div style={{ fontSize: 13, marginBottom: 10,
                  color: /错误|过期|失败|重新|未找到|未完成|不正确|失效/.test(qr.message || '')
                    ? 'var(--red)' : 'var(--text-secondary)' }}>
                  {qr.message || 'Die Plattform verlangt eine SMS-Bestätigung; der Code wurde an dein Handy gesendet, bitte eingeben:'}
                </div>
                <input
                  value={smsCode}
                  onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  onKeyDown={(e) => { if (e.key === 'Enter') submitSms(); }}
                  placeholder="SMS-Code" inputMode="numeric" autoFocus
                  style={{ width: '100%', boxSizing: 'border-box', textAlign: 'center',
                    letterSpacing: 6, fontSize: 20, padding: '10px 12px',
                    border: '1px solid var(--border)', borderRadius: 8 }} />
                {smsErr && <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 6 }}>{smsErr}</div>}
                <button className="btn btn-primary btn-block" style={{ marginTop: 12 }}
                  disabled={smsBusy} onClick={submitSms}>
                  {smsBusy ? 'Wird gesendet …' : 'Code senden'}
                </button>
              </div>
            ) : qr.state === 'qr_ready' && qr.qr ? (
              <img className="qr-img" src={`${mediaUrl(qr.qr)}?v=${qr.qrTs || qrNonce}`} alt="Anmelde-QR-Code" />
            ) : qr.state === 'scanned' ? (
              <div className="loading" style={{ padding: 40 }}><div className="spinner" />
                {qr.message || 'Scan erfolgreich, bitte am Handy bestätigen; warte auf die Plattform …'}
              </div>
            ) : qr.state === 'verifying' ? (
              <div className="loading" style={{ padding: 40 }}><div className="spinner" />Code wird geprüft, Anmeldung läuft …</div>
            ) : qr.state === 'window_login' ? (
              // 无扫码平台（X）：本机弹有头浏览器窗口，用户在窗口里手动登录
              <div className="loading" style={{ padding: 40 }}><div className="spinner" />
                {qr.message || 'Bitte die Anmeldung im geöffneten Browserfenster abschließen'}</div>
            ) : qr.state === 'success' ? (
              <div style={{ fontSize: 48, padding: 40 }}>✅</div>
            ) : ['error', 'expired'].includes(qr.state) ? (
              <div style={{ fontSize: 13, color: 'var(--red)', padding: 30 }}>
                {qr.message || 'Anmeldung fehlgeschlagen'}<br />Bitte anhand des Grundes oben prüfen; Fenster schließen und erneut versuchen. Protokolle liegen in outputs/_login/.
              </div>
            ) : (
              <div className="loading" style={{ padding: 40 }}><div className="spinner" />QR-Code wird vorbereitet …</div>
            )}
            <div style={{ marginTop: 16 }}>
              <button className="btn" onClick={closeQr}>{qr.state === 'success' ? 'Fertig' : 'Schließen'}</button>
            </div>
          </div>
        </div>
      )}

      {cred && (
        <div className="overlay" onClick={closeCred}>
          <div className="modal" style={{ width: 420, maxWidth: '100%' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 4px' }}>Einrichten {cred.name}</h3>
            <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.6 }}>
              Das Konto nutzt die offizielle Schnittstelle und braucht Entwickler-Zugangsdaten.<br />
              ⚠️ Die ausgehende IP dieses Servers muss auf der IP-Whitelist stehen, sonst kommt Fehler 40164. Beiträge landen im<b>Entwurfsordner</b>, Versand bitte im Backend bestätigen.
            </div>
            {credMsg && <div style={{ fontSize: 12.5, color: 'var(--green)', marginBottom: 10 }}>{credMsg}</div>}
            <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>AppID</label>
            <input value={credForm.appId} autoFocus
              onChange={(e) => setCredForm((f) => ({ ...f, appId: e.target.value.trim() }))}
              placeholder="wx..." style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px',
                margin: '4px 0 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14 }} />
            <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>AppSecret</label>
            <input value={credForm.appSecret} type="password"
              onChange={(e) => setCredForm((f) => ({ ...f, appSecret: e.target.value.trim() }))}
              placeholder="Entwicklerschlüssel (wird nicht angezeigt)" style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px',
                margin: '4px 0 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14 }} />
            <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Standard-Autor (optional)</label>
            <input value={credForm.author}
              onChange={(e) => setCredForm((f) => ({ ...f, author: e.target.value }))}
              placeholder="Autorenzeile" style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px',
                margin: '4px 0 4px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14 }} />
            {credErr && <div style={{ color: 'var(--red)', fontSize: 12.5, marginTop: 8 }}>{credErr}</div>}
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} disabled={credBusy} onClick={submitCred}>
                {credBusy ? 'Wird bestätigt …' : 'Speichern und prüfen'}
              </button>
              <button className="btn" onClick={closeCred}>Schließen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

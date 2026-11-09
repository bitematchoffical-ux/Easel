import type { ComponentType } from 'react';
import type { EnvTool } from '../lib/api';
import {
  IconHexagon, IconFilm, IconFileCode, IconAudioWaveform, IconDatabase,
  IconPackage, IconMonitor, IconTv, IconGlobe, IconCompass, IconLibrary,
} from './settingsIcons';

export interface JobView {
  state: 'running' | 'ok' | 'fail';
  line: string;
  detail?: string | null;
}

interface Props {
  tools: EnvTool[];
  python: string;
  loading: boolean;
  error: string;
  jobs: Record<string, JobView>;
  anyRunning: boolean;
  onRefresh: () => void;
  onInstall: (id: string) => Promise<void>;
  onInstallMany: (ids: string[]) => Promise<void>;
}

const ICONS: Record<string, ComponentType<{ size?: number }>> = {
  node: IconHexagon, ffmpeg: IconFilm, python: IconFileCode, fw: IconAudioWaveform,
  model: IconDatabase, rmdeps: IconPackage, shell: IconMonitor, biliup: IconTv,
  pw: IconGlobe, cft: IconCompass, pylibs: IconLibrary,
};

const GROUPS: { id: string; title: string; en: string }[] = [
  { id: 'rm', title: 'Video-Produktionspaket', en: 'Remotion' },
  { id: 'pub', title: 'Veröffentlichungskette', en: 'Posten und Rücklesen' },
  { id: 'common', title: 'Standardbibliotheken', en: 'Bei Bedarf' },
];

/** 环境安装页：引擎（install_tool）的真实体检 + 后台安装 + 进度轮询。 */
export default function EnvBoard({ tools, python, loading, error, jobs, anyRunning, onRefresh, onInstall, onInstallMany }: Props) {
  const total = tools.length;
  const okCount = tools.filter((t) => t.state === 'ok').length;
  const allDone = total > 0 && okCount === total;
  const pid = python ? python.split('\\').pop() : '';

  const groupTools = (gid: string) => tools.filter((t) => t.group === gid);
  const installable = (t: EnvTool) => t.state !== 'no_dir';

  const runAll = () => {
    const ids = tools.filter((t) => t.state !== 'ok' && installable(t)).map((t) => t.id);
    if (ids.length) void onInstallMany(ids);
  };
  const runGroup = (gid: string) => {
    const ids = groupTools(gid).filter((t) => t.state !== 'ok' && installable(t)).map((t) => t.id);
    if (ids.length) void onInstallMany(ids);
  };

  const view = (t: EnvTool): { state: 'ok' | 'missing' | 'busy' | 'fail' | 'nodir'; badge: string; cls: string } => {
    const job = jobs[t.id];
    if (job?.state === 'running') return { state: 'busy', badge: 'Wird installiert', cls: 'warn' };
    if (t.state === 'ok') return { state: 'ok', badge: 'Installiert', cls: 'ok' };
    // 刚装完、面板还在重新体检的过渡窗口：显示「校验中」，别闪回「未装」
    if (job?.state === 'ok') return { state: 'busy', badge: 'Wird geprüft', cls: 'warn' };
    if (job?.state === 'fail') return { state: 'fail', badge: 'Fehler', cls: 'fail' };
    if (t.state === 'no_dir') return { state: 'nodir', badge: 'Verzeichnis nötig', cls: 'warn' };
    if (t.state === 'fail') return { state: 'fail', badge: 'Fehler', cls: 'fail' };
    return { state: 'missing', badge: 'Nicht installiert', cls: 'off' };
  };

  return (
    <section className="st-env">
      <div className="panel-top">
        <span className="pill sum" aria-live="polite">{allDone ? 'Alles bereit' : `Bereit ${okCount} / ${total}`}</span>
        <span className="desc">
          Nach Installation automatisch prüfen{pid ? ` · Ziel-Interpreter ${pid}` : ''} · für andere Rechner = ganzen Ordner kopieren
        </span>
        <span className="spacer" />
        <button className="btn btn-sm" onClick={onRefresh} disabled={loading || anyRunning}>
          {loading ? 'Wird geprüft …' : 'Erneut prüfen'}
        </button>
        <button className="btn btn-sm btn-primary" onClick={runAll} disabled={anyRunning || allDone || !total}>
          Alles installieren
        </button>
      </div>
      <div className="env-meter" role="progressbar" aria-label="Einrichtungsfortschritt">
        <i style={{ transform: `scaleX(${total ? okCount / total : 0})` }} />
      </div>
      {error ? <div className="env-error">{error}</div> : null}
      {loading && !tools.length ? (
        <div className="board"><div className="empty"><span className="spin" /> Umgebung wird geprüft …<span className="hint">(bei hoher Last etwas langsamer, wird automatisch wiederholt)</span></div></div>
      ) : null}

      {GROUPS.map((g) => {
        const list = groupTools(g.id);
        if (!list.length) return null;
        const ok = list.filter((t) => t.state === 'ok').length;
        const pending = list.filter((t) => t.state !== 'ok' && installable(t)).length;
        return (
          <div className="grp" key={g.id}>
            <div className="grp-hd">
              <h3>{g.title} <span className="en">{g.en}</span></h3>
              <span className="grp-stat">{ok} / {list.length} Bereit</span>
              <button className="btn btn-sm" onClick={() => runGroup(g.id)} disabled={anyRunning || pending === 0}>
                Gruppe installieren
              </button>
            </div>
            <div className="grid">
              {list.map((t) => {
                const v = view(t);
                const Icon = ICONS[t.id] || IconPackage;
                const job = jobs[t.id];
                return (
                  <div className="card" key={t.id} data-tool={t.id} data-state={v.state}>
                    <div className="card-top">
                      <span className="tile"><Icon size={17} /></span>
                      <span className={`badge pill ${v.cls}`}><span className="dot" />{v.badge}</span>
                    </div>
                    <div className="card-name">{t.name}</div>
                    <div className="card-desc">{t.desc}</div>
                    <div className="card-foot">
                      {v.state === 'busy' ? (
                        <>
                          <span className="foot-status busy" title={job?.line || ''}>{job?.line || 'Startet …'}</span>
                          <div className="prog">
                            <div className="bar"><i /></div>
                            <span className="spin" />
                          </div>
                          <button className="btn btn-sm" disabled>Wird installiert</button>
                        </>
                      ) : (
                        <>
                          <span
                            className="foot-status"
                            title={v.state === 'fail' ? (job?.detail || t.detail || '') : (t.version || '')}
                          >
                            {v.state === 'ok'
                              ? (t.version || 'Bereit')
                              : v.state === 'fail'
                                ? (job?.detail || t.detail || 'Grund anzeigen')
                                : v.state === 'nodir'
                                  ? 'Projektverzeichnis angeben'
                                  : ''}
                          </span>
                          {v.state === 'nodir' ? (
                            <button className="btn btn-sm" disabled title="Benötigt --dir Projektverzeichnis (in der Standalone-Version enthalten)">Verzeichnis nötig</button>
                          ) : v.state === 'fail' ? (
                            <button className="btn btn-sm btn-fill" onClick={() => void onInstall(t.id)} disabled={anyRunning}>Erneut versuchen</button>
                          ) : (
                            <button
                              className={`btn btn-sm ${v.state === 'ok' ? '' : 'btn-fill'}`}
                              onClick={() => void onInstall(t.id)}
                              disabled={anyRunning}
                            >
                              {v.state === 'ok' ? 'Neu installieren' : 'Installieren'}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="foot-note">Ziel: Benutzerumgebung dieses Rechners (Python auf Benutzerebene, PATH wird automatisch gesetzt). Für andere Rechner den ganzen Ordner der Standalone-Version kopieren und per Doppelklick öffnen.</div>
    </section>
  );
}

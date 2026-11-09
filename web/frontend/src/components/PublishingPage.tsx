import { useEffect, useState } from 'react';
import { fetchPublishingPolicy } from '../lib/api';
import type { PublishingPolicy } from '../lib/api';
import AutomatedPublishPage from './PublishPage';
import ManualPublishPage from './ManualPublishPage';

export default function PublishingPage({ persona }: { persona: string }) {
  const [policy, setPolicy] = useState<PublishingPolicy | null>(null);
  const [mode, setMode] = useState<PublishingPolicy['mode']>('automated');
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setError('');
    fetchPublishingPolicy().then((value) => {
      if (active) {
        setPolicy(value);
        // Postloop: Instagram/TikTok/YouTube gibt es bisher nur im Export-Tab → der ist Standard
        setMode('manual');
      }
    })
      .catch(() => { if (active) setError('Veröffentlichungsmodus konnte nicht gelesen werden, bitte erneut versuchen.'); });
    return () => { active = false; };
  }, [retry]);
  if (error) return <div className="panel" role="alert">{error}
    <button className="btn btn-sm" onClick={() => setRetry((value) => value + 1)}>Erneut laden</button>
  </div>;
  if (!policy) return <div className="dash-empty">Veröffentlichungsmodus wird geladen …</div>;
  const automaticAllowed = policy.mode === 'automated' && policy.automaticSubmission;
  const manual = mode === 'manual' || !automaticAllowed;
  return <div className="publishing-workspace">
    <div className="publishing-mode-bar">
      <div className="subnav-tabs" role="group" aria-label="Veröffentlichungsmodus">
        <button type="button" className={`subnav-tab ${!manual ? 'active' : ''}`}
          aria-pressed={!manual} disabled={!automaticAllowed} onClick={() => setMode('automated')}>
          Automatisch
        </button>
        <button type="button" className={`subnav-tab ${manual ? 'active' : ''}`}
          aria-pressed={manual} onClick={() => setMode('manual')}>
          Export (selbst posten)
        </button>
      </div>
      <span className="pv-hint">{!automaticAllowed
        ? 'Automatisches Posten ist vom Administrator deaktiviert; nur der Export ist verfügbar.'
        : manual ? 'Prüfen, dann kopieren oder exportieren und auf der offiziellen Seite selbst posten; der Wechsel ändert die globale Einstellung nicht.'
          : 'Bisheriger Ablauf mit Kontoprüfung, Vorabcheck, Bestätigung und automatischem Posten.'}</span>
    </div>
    <div className="publishing-mode-content">
      {manual ? <ManualPublishPage persona={persona} /> : <AutomatedPublishPage persona={persona} />}
    </div>
  </div>;
}

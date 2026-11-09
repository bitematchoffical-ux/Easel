import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChatQuestion, ChatQuestionItem } from '../lib/api';
import { answerQuestion, questionStatus } from '../lib/api';

/**
 * ask_user 问答题卡片。
 *
 * OpenClaw 的 ask_user 一次可带 1-3 个问题（question.questions[]）。gateway 的
 * question.resolve 要求 answers 里**每个问题都有答案**（单个缺失即报
 * QUESTION_INVALID_ANSWER: "question 'xxx' requires an answer"）。
 * 因此多问题时渲染全部题目，用户每问答完一项，全部选齐后自动提交一次。
 *
 * 多选：问题对象带 multiSelect: true 时，answers[qid] 可携带多个 label
 * （gateway 对 multiSelect=false 的多值直接报 "does not allow multiple answers"，
 * 前端只按数据渲染，不绕过校验）。
 */
function QuestionCard({ question, onAnswered, onClosed }: { question: ChatQuestion; onAnswered: () => void;
  onClosed?: (status: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [custom, setCustom] = useState<Record<string, string>>({});
  const [customVals, setCustomVals] = useState<Record<string, string[]>>({});
  const [showCustom, setShowCustom] = useState<Record<string, boolean>>({});
  const [now, setNow] = useState(Date.now());
  const [closed, setClosed] = useState('');
  const deadlineReached = typeof question.expiresAtMs === 'number' && now >= question.expiresAtMs;
  const status = closed || question.status || 'pending';
  const expired = deadlineReached || (status !== 'pending' && status !== 'unknown');
  const locked = busy || expired;
  const closedCallback = useRef(onClosed);
  closedCallback.current = onClosed;

  useEffect(() => {
    if (status !== 'pending' || deadlineReached) return;
    let active = true;
    const tick = () => {
      setNow(Date.now());
      void questionStatus([question.id]).then(states => {
        const next = states[question.id]?.status;
        if (active && next && next !== 'pending' && next !== 'unknown') {
          setClosed(next);
          closedCallback.current?.(next);
        }
      });
    };
    tick();
    const timer = setInterval(tick, 5000);
    return () => { active = false; clearInterval(timer); };
  }, [question.id, status, deadlineReached]);

  const items: ChatQuestionItem[] = question.questions || [];
  const valsOf = (it: ChatQuestionItem): string[] => selected[it.questionId] || [];
  const allAnswered = items.length > 0 && items.every((it) => valsOf(it).length > 0);

  const pick = (it: ChatQuestionItem, label: string) => {
    setSelected((s) => {
      const cur = s[it.questionId] || [];
      const next = it.multiSelect
        ? (cur.includes(label) ? cur.filter((v) => v !== label) : [...cur, label])
        : [label];
      return { ...s, [it.questionId]: next };
    });
  };

  const fillCustom = (it: ChatQuestionItem) => {
    const v = (custom[it.questionId] || '').trim();
    if (!v) return;
    setSelected((s) => {
      const cur = s[it.questionId] || [];
      return { ...s, [it.questionId]: it.multiSelect && !cur.includes(v) ? [...cur, v] : [v] };
    });
    setCustomVals((c) => {
      const cur = c[it.questionId] || [];
      return { ...c, [it.questionId]: cur.includes(v) ? cur : [...cur, v] };
    });
  };

  const removeCustom = (it: ChatQuestionItem, v: string) => {
    setSelected((s) => ({ ...s, [it.questionId]: (s[it.questionId] || []).filter((x) => x !== v) }));
    setCustomVals((c) => ({ ...c, [it.questionId]: (c[it.questionId] || []).filter((x) => x !== v) }));
  };

  const submit = async () => {
    if (locked || !allAnswered) return;
    setBusy(true); setError('');
    const answers: Record<string, string[]> = {};
    for (const it of items) answers[it.questionId] = valsOf(it);
    try {
      const res = await answerQuestion({ questionId: question.id, answers });
      if (!res.ok && (res.expired || (res.status && res.status !== 'pending'))) {
        setClosed(res.status || 'expired');
        onClosed?.(res.status || 'expired');
        setError('Diese Frage ist abgelaufen oder geschlossen. Wenn noch etwas fehlt, bitte im Chatfeld antworten.');
      } else if (!res.ok) setError(res.error || 'Senden fehlgeschlagen');
      else onAnswered();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="message-row assistant">
      <div className="msg-col assistant" style={{ maxWidth: '80%' }}>
        <div className="question-card">
          {expired ? <div className="question-card__hint">Diese Frage ist abgelaufen oder geschlossen und kann nicht mehr beantwortet werden. Bitte im Chatfeld ergänzen.</div>
            : typeof question.expiresAtMs === 'number' && <div className="question-card__hint">
              Frist des Gateways: {new Date(question.expiresAtMs).toLocaleString()} · noch etwa  {Math.max(0, Math.ceil((question.expiresAtMs - now) / 60000))}  Minuten (kann früher schließen)
            </div>}
          {items.map((it, idx) => {
            const options: { label: string; description?: string }[] = it.options || [];
            const vals = valsOf(it);
            const ctl = showCustom[it.questionId];
            const cvals = customVals[it.questionId] || [];
            return (
              <div key={it.questionId} className="question-card__item">
                {idx > 0 && <div className="question-card__divider" />}
                {it.header && <div className="question-card__chip">{it.header}</div>}
                <div className="question-card__title">
                  {it.question || 'Bitte wählen'}
                  {it.multiSelect && <span className="question-card__multi">Mehrfachauswahl</span>}
                </div>
                <div className="question-card__options">
                  {options.map((opt) => (
                    <button key={opt.label}
                      className={`question-card__option${vals.includes(opt.label) ? ' question-card__option--selected' : ''}`}
                      disabled={locked}
                      onClick={() => pick(it, opt.label)}>
                      <strong>{opt.label}</strong>
                      {opt.description && <span>{opt.description}</span>}
                    </button>
                  ))}
                  {cvals.map((v) => (
                    <button key={`custom-${v}`}
                      className="question-card__option question-card__option--selected"
                      disabled={locked}
                      title="Zum Entfernen klicken"
                      onClick={() => removeCustom(it, v)}>
                      <strong>{v}</strong>
                      <span>Eigene Angabe · zum Entfernen klicken</span>
                    </button>
                  ))}
                  <button className="question-card__other" disabled={locked}
                    onClick={() => setShowCustom((s) => ({ ...s, [it.questionId]: !s[it.questionId] }))}>
                    {ctl ? 'Eigene Eingabe einklappen' : 'Selbst eingeben …'}
                  </button>
                </div>
                {ctl && (
                  <div className="question-card__custom">
                    <input
                      type="text"
                      disabled={locked}
                      value={custom[it.questionId] || ''}
                      placeholder="Deine Antwort"
                      onChange={(e) => setCustom((c) => ({ ...c, [it.questionId]: e.target.value }))}
                    />
                    <button disabled={locked || !(custom[it.questionId] || '').trim()}
                      onClick={() => fillCustom(it)}>
                      Übernehmen
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* 单选题：选完点提交；多题：全部选齐后提交（单选/多选同一规则） */}
          {items.length === 1 ? (
            <div className="question-card__actions">
              <button className="question-card__submit" disabled={locked || !allAnswered}
                onClick={() => void submit()}>
                Senden
              </button>
            </div>
          ) : (
            allAnswered && !locked && (
              <div className="question-card__actions">
                <button className="question-card__submit" disabled={locked} onClick={() => void submit()}>
                  Alles ausgewählt, senden
                </button>
              </div>
            )
          )}
          {busy && <div className="question-card__hint">Gesendet, der Agent arbeitet weiter …</div>}
          {error && <div className="question-card__hint question-card__error">{error}</div>}
        </div>
      </div>
    </div>
  );
}

/** 流式中的 ask_user 问答题列表（一次性卡片，答完即从当前流移除）。 */
export default function QuestionCards({ questions, onDone, onClosed }: { questions: ChatQuestion[];
  onDone?: (questionId: string) => void; onClosed?: (id: string, status: string) => void }) {
  const [answered, setAnswered] = useState<Record<string, boolean>>({});
  const visible = useMemo(
    () => questions.filter((q) => !answered[q.id] && q.status !== 'answered' && q.status !== 'resolved'),
    [questions, answered],
  );
  if (!visible.length) return null;
  return (
    <>
      {visible.map((q) => (
        <QuestionCard key={q.id} question={q} onClosed={status => onClosed?.(q.id, status)} onAnswered={() => {
          setAnswered((a) => ({ ...a, [q.id]: true }));
          onDone?.(q.id);   // 通知 App：此题已答，重放/恢复不再出现
        }} />
      ))}
    </>
  );
}

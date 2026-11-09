import { useState, useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import QuestionCards from './QuestionCards';
import BrushEntry from './BrushEntry';
import type { ChatSession, ChatMessage, StreamState } from '../lib/store';
import { uploadFiles, adoptOversize } from '../lib/api';
import type { UploadedFile } from '../lib/api';
import { IconArrowUp, IconStop, IconPlus, IconFile } from './icons';

interface ChatPageProps {
  apiDirect: boolean;
  session: ChatSession;
  stream?: StreamState;          // 进行中的流式态（来自 App，切页也不丢）
  onSend: (displayText: string, attachments?: UploadedFile[]) => void;
  onStop: () => void;
  onResend: (
    userIndex: number,
    displayText: string,
    attachments?: UploadedFile[],
    legacyAgentText?: string,
  ) => void; // 重试：仅对最后一轮
  onQuestionAnswered?: (questionId: string) => void;   // 某道问答题提交成功（App 记录答过，重放不再出现）
  onQuestionClosed?: (id: string, status: string) => void;
}

// 空态推荐（贴合 Postloop 社媒创作场景）
const SUGGESTIONS = [
  { icon: '🔥', title: 'Trend aufgreifen', prompt: 'Was ist gerade auf TikTok und Instagram angesagt? Such ein paar Themen aus, die ich remixen kann' },
  { icon: '✍️', title: 'Instagram-Caption', prompt: 'Schreib mir eine Instagram-Caption; frag mich zuerst nach dem Thema' },
  { icon: '🎴', title: 'Zitatkarte', prompt: 'Mach aus einem starken Satz eine Zitatkarte zum Teilen' },
  { icon: '🎬', title: 'Reel-Skript', prompt: 'Schreib mir ein 60-Sekunden-Skript für ein Reel/TikTok; frag mich zuerst nach dem Thema' },
];

function greeting(): string {
  const h = new Date().getHours();
  const g = h < 6 ? 'Noch wach?' : h < 12 ? 'Guten Morgen' : h < 14 ? 'Mahlzeit' : h < 18 ? 'Guten Tag' : 'Guten Abend';
  return `${g}, was möchtest du erstellen?`;
}

export default function ChatPage({ apiDirect, session, stream, onSend, onStop, onResend, onQuestionAnswered, onQuestionClosed }: ChatPageProps) {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [maxMb, setMaxMb] = useState(50);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isComposingRef = useRef(false);

  const isStreaming = !!stream;
  const isEmpty = session.messages.length === 0 && !isStreaming;

  useEffect(() => {
    fetch('/api/upload/limits').then((r) => r.json())
      .then((d) => { if (d?.max_mb) setMaxMb(d.max_mb); }).catch(() => {});
  }, []);

  const doUpload = async (fs: FileList | File[]) => {
    const arr = Array.from(fs);
    if (!arr.length) return;
    const cap = maxMb * 1024 * 1024;
    const big = arr.filter((f) => f.size > cap);
    const small = arr.filter((f) => f.size <= cap);

    if (big.length) {
      // 超限：不走上传通道，复制进收件箱后作为普通附件（界面零新增元素）
      setUploading(true);
      try {
        const saved = await adoptOversize(big, session.id);
        setAttachments((a) => [...a, ...saved]);
      } catch (err) {
        alert((err as Error).message || 'Große Datei konnte nicht verarbeitet werden');
      } finally {
        setUploading(false);
      }
    }
    if (!small.length) return;
    setUploading(true);
    try {
      const saved = await uploadFiles(small, session.id);
      setAttachments((a) => [...a, ...saved]);
    } catch (err) {
      alert((err as Error).message || 'Hochladen fehlgeschlagen');
    } finally {
      setUploading(false);
    }
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    if (e.dataTransfer.files?.length) doUpload(e.dataTransfer.files);
  };
  const onPaste = (e: React.ClipboardEvent) => {
    if (e.clipboardData.files?.length) { e.preventDefault(); doUpload(e.clipboardData.files); }
  };
  const removeAttachment = (path: string) => setAttachments((a) => a.filter((x) => x.path !== path));

  useEffect(() => {
    if (!isEmpty) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session.messages, stream?.content, stream?.thinking, stream?.activity, stream?.stillWorking, isEmpty]);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 180) + 'px';
    }
  }, [input]);

  const handleSend = () => {
    const trimmed = input.trim();
    if ((!trimmed && attachments.length === 0) || isStreaming || uploading) return;
    // 附件通过结构化字段发送；用户消息气泡只显示用户实际输入的文字。
    onSend(trimmed, attachments);
    setInput('');
    setAttachments([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 输入法确认候选词/英文的回车交给输入法处理，不能触发发送。
    // 部分浏览器先触发 compositionend，此时仍需用 229 识别输入法按键。
    if (isComposingRef.current || e.nativeEvent.isComposing || e.nativeEvent.keyCode === 229) return;
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const inputBox = (hero: boolean) => (
    <div className={`composer ${hero ? 'composer-hero' : ''} ${dragOver ? 'composer-drag' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
      onDrop={onDrop}>
      {attachments.length > 0 && (
        <div className="composer-attachments">
          {attachments.map((a) => (
            <span key={a.path} className="attach-chip" title={a.path}>
              <IconFile size={12} /> <span className="attach-name">{a.name}</span>
              <button className="attach-x" onClick={() => removeAttachment(a.path)} title="Entfernen">×</button>
            </span>
          ))}
        </div>
      )}
      <div className="composer-top">
        {apiDirect ? <span className="composer-hint">Direkte API · Text- und Anhang-Analyse</span>
          : <BrushEntry onPick={(t) => { setInput(t); requestAnimationFrame(() => textareaRef.current?.focus()); }} />}
        <textarea
          ref={textareaRef}
          className="chat-input"
          placeholder={dragOver ? 'Loslassen, um Material hochzuladen …' : hero ? 'Erzähl mir deine Idee: Thema, Text, Karussell, Video oder Posten, alles geht … (Bilder/Dokumente als Material reinziehen)' : 'Nachricht … (Enter senden, Shift+Enter neue Zeile, Material reinziehen/einfügen)'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onCompositionStart={() => { isComposingRef.current = true; }}
          onCompositionEnd={() => { isComposingRef.current = false; }}
          onBlur={() => { isComposingRef.current = false; }}
          onKeyDown={handleKeyDown}
          onPaste={onPaste}
          rows={1}
          autoFocus={hero}
        />
      </div>
      <input ref={fileInputRef} type="file" multiple hidden
        onChange={(e) => { if (e.target.files) doUpload(e.target.files); e.target.value = ''; }} />
      <div className="composer-bar">
        <button className="composer-attach-btn" onClick={() => fileInputRef.current?.click()}
          disabled={isStreaming || uploading} title={`Material hinzufügen (Bilder/Dokumente); Dateien über ${maxMb} MB werden automatisch lokal gespeichert (kein Upload)`}>
          <IconPlus size={15} /> {uploading ? 'Wird hochgeladen …' : 'Material'}
        </button>
        <span className="composer-hint">{isStreaming ? 'Wird erzeugt …' : 'Enter senden · Shift+Enter neue Zeile'}</span>
        {isStreaming ? (
          <button className="send-btn" onClick={onStop} title="Stopp"><IconStop size={15} /></button>
        ) : (
          <button className="send-btn" onClick={handleSend} disabled={(!input.trim() && !attachments.length) || uploading} title="Senden"><IconArrowUp size={17} /></button>
        )}
      </div>
    </div>
  );

  // ---- 空态：居中欢迎页 ----
  if (isEmpty) {
    return (
      <div className="chat-page">
        <div className="chat-hero">
          <div className="chat-hero-brand">
            <img src="./static/postloop-icon.svg" alt="" />
            <span>Postloop</span>
          </div>
          <h1 className="chat-hero-title">{greeting()}</h1>
          <p className="chat-hero-sub">{apiDirect ? 'Direkte API: Texte schreiben, Themen planen, Anhänge analysieren. Lokale Werkzeuge und automatisches Posten sind aus.'
            : 'Von der Idee bis zum Post: alles an einem Ort.'}</p>
          {inputBox(true)}
          <div className="suggestions">
            {SUGGESTIONS.filter((s) => !apiDirect || ['Instagram-Caption', 'Reel-Skript'].includes(s.title)).map((s) => (
              <button key={s.title} className="card card-hover suggestion-card"
                onClick={() => { if (!isStreaming) onSend(s.prompt); }}>
                <span className="suggestion-icon">{s.icon}</span>
                <span className="suggestion-body">
                  <span className="suggestion-title">{s.title}</span>
                  <span className="suggestion-text">{s.prompt}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ---- 对话态 ----
  const displayMessages: ChatMessage[] = [...session.messages];
  if (isStreaming) displayMessages.push({ role: 'assistant', content: stream!.content || '' });

  return (
    <div className="chat-page">
      <div className="chat-messages">
        <div className="chat-thread">
          {displayMessages.map((msg, i) => {
            const isLast = i === displayMessages.length - 1;
            const live = isStreaming && isLast && msg.role === 'assistant';
            const isFinal = !live && i < session.messages.length;
            let actions;
            if (isFinal) {
              const copy = () => navigator.clipboard?.writeText(msg.content);
              // 只允许对「最后一轮」重试，契合 OpenClaw append-only 模型（不改写历史）；已移除编辑
              const isLastFinal = i === session.messages.length - 1;
              if (msg.role === 'user') {
                actions = {
                  onCopy: copy,
                  onRetry: isLastFinal
                    ? () => onResend(i, msg.content, msg.attachments, msg.agentContent)
                    : undefined,
                  canModify: !isStreaming,
                };
              } else {
                const pi = i - 1;
                const prevUser = pi >= 0 && session.messages[pi]?.role === 'user' ? session.messages[pi] : null;
                actions = {
                  onCopy: copy,
                  onRetry: (isLastFinal && prevUser)
                    ? () => onResend(pi, prevUser.content, prevUser.attachments, prevUser.agentContent)
                    : undefined,
                  canModify: !isStreaming,
                };
              }
            }
            return (
              <div key={`${i}-${msg.role}`}>
              <MessageBubble
                key={`${i}-${msg.role}`}
                message={msg}
                isStreaming={live}
                thinking={live ? stream!.thinking : ''}
                activity={live ? stream!.activity : ''}
                stillWorking={live ? stream!.stillWorking : ''}
                actions={actions}
              />
              {!live && msg.questions && <QuestionCards questions={msg.questions} onDone={onQuestionAnswered} onClosed={onQuestionClosed} />}
              </div>
            );
          })}
          {isStreaming && (stream!.questions?.length ?? 0) > 0 && (
            <QuestionCards questions={stream!.questions || []} onDone={(qid) => onQuestionAnswered?.(qid)} onClosed={onQuestionClosed} />
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="chat-input-area">
        <div className="chat-input-inner">{inputBox(false)}</div>
      </div>
    </div>
  );
}

import SettingsSelect from './SettingsSelect';
import { useState } from 'react';
import type { ChatSession } from '../lib/store';
import type { PersonaItem } from '../lib/api';
import type { ComponentType } from 'react';
import {
  IconChat, IconSkills, IconOutputs, IconAccounts, IconProfile,
  IconNewChat, IconEdit, IconArchive, IconUnarchive, IconTrash, IconChevron,
  IconDashboard,
} from './icons';
import { IconGear } from './settingsIcons';
import ThemeToggle from './ThemeToggle';

export type Page = 'dashboard' | 'chat' | 'trends' | 'ideas' | 'calendar' | 'publish' | 'breakdown' | 'skills' | 'outputs' | 'accounts' | 'profile';

interface SidebarProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
  personas: PersonaItem[];
  selectedPersona: string;
  onPersonaChange: (persona: string) => void;
  onNewProfile: () => void;
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSessionSelect: (id: string) => void;
  onSessionDelete: (id: string) => void;
  onSessionRename: (id: string, title: string) => void;
  onSessionArchive: (id: string, archived: boolean) => void;
  onNewChat: () => void;
  gatewayStatus: string;
  apiDirect: boolean;
  agentRuntime: string;
  onOpenSettings: () => void;
}

// 主导航（精简）；热点雷达/选题库/内容日历/发布中心 收进「工作台」，不占侧栏
const NAV: { page: Page; Icon: ComponentType<{ size?: number }>; label: string }[] = [
  { page: 'dashboard', Icon: IconDashboard, label: 'Arbeitsbereich' },
  { page: 'chat', Icon: IconChat, label: 'Chat' },
  { page: 'skills', Icon: IconSkills, label: 'Skills' },
  { page: 'outputs', Icon: IconOutputs, label: 'Inhaltsbibliothek' },
  { page: 'accounts', Icon: IconAccounts, label: 'Konten' },
  { page: 'profile', Icon: IconProfile, label: 'Profile' },
];

export default function Sidebar({
  currentPage,
  onPageChange,
  personas,
  selectedPersona,
  onPersonaChange,
  onNewProfile,
  sessions,
  activeSessionId,
  onSessionSelect,
  onSessionDelete,
  onSessionRename,
  onSessionArchive,
  onNewChat,
  gatewayStatus,
  apiDirect,
  agentRuntime,
  onOpenSettings,
}: SidebarProps) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const startRename = (s: ChatSession) => { setRenamingId(s.id); setRenameValue(s.title); };
  const commitRename = () => {
    if (renamingId) onSessionRename(renamingId, renameValue);
    setRenamingId(null);
  };

  const active = sessions.filter((s) => !s.archived && (s.messages.length > 0 || s.id === activeSessionId));
  const archived = sessions.filter((s) => s.archived);

  const renderItem = (s: ChatSession, isArchived: boolean) => {
    if (renamingId === s.id) {
      return (
        <div key={s.id} className="session-item">
          <input
            className="session-rename-input"
            value={renameValue}
            autoFocus
            onChange={(e) => setRenameValue(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitRename();
              else if (e.key === 'Escape') setRenamingId(null);
            }}
            onBlur={commitRename}
          />
        </div>
      );
    }
    return (
      <div
        key={s.id}
        className={`session-item ${s.id === activeSessionId ? 'active' : ''}`}
        onClick={() => onSessionSelect(s.id)}
      >
        <span className="session-item-title">{s.title}</span>
        <div className="session-actions">
          <button className="session-act" title="Umbenennen"
            onClick={(e) => { e.stopPropagation(); startRename(s); }}><IconEdit size={14} /></button>
          <button className="session-act" title={isArchived ? 'Aus Archiv holen' : 'Archivieren'}
            onClick={(e) => { e.stopPropagation(); onSessionArchive(s.id, !isArchived); }}>
            {isArchived ? <IconUnarchive size={14} /> : <IconArchive size={14} />}
          </button>
          <button className="session-act danger" title="Löschen"
            onClick={(e) => { e.stopPropagation(); onSessionDelete(s.id); }}><IconTrash size={14} /></button>
        </div>
      </div>
    );
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <img className="sidebar-logo-icon" src="./static/postloop-icon.svg" alt="" />
          <h1>Postloop</h1>
          <ThemeToggle />
        </div>
        <SettingsSelect className="persona-control" label="Profil wählen"
          title="Profil wählen (ein Chat = ein Profil; ein Wechsel startet einen neuen Chat)"
          value={selectedPersona}
          options={[{ value: '', label: 'Allgemeiner Modus' },
            ...personas.map(p => ({ value: p.name, label: p.name })),
            { value: '__new__', label: '+ Neues Profil …' }]}
          onChange={(value) => {
            if (value === '__new__') { onNewProfile(); return; }
            onPersonaChange(value);
          }} />
      </div>

      <nav className="sidebar-nav">
        {NAV.map(({ page, Icon, label }) => (
          <button
            key={page}
            className={`nav-item ${currentPage === page ? 'active' : ''}`}
            onClick={() => onPageChange(page)}
          >
            <span className="nav-icon"><Icon size={18} /></span>
            {label}
          </button>
        ))}
      </nav>

      <div className="sidebar-section">
        <div className="sidebar-section-header">
          <span className="sidebar-section-title">Chat</span>
          <button className="new-chat-btn" onClick={onNewChat} title="Neuer Chat">
            <IconNewChat size={13} /> Neuer Chat
          </button>
        </div>
        {active.map((s) => renderItem(s, false))}

        {archived.length > 0 && (
          <>
            <div className="archived-header" onClick={() => setShowArchived((v) => !v)}>
              <span className={`archived-chevron ${showArchived ? 'open' : ''}`}><IconChevron size={12} /></span>
              Archiviert · {archived.length}
            </div>
            {showArchived && archived.map((s) => renderItem(s, true))}
          </>
        )}
      </div>

      <div className="sidebar-status">
        <span className={`status-dot ${gatewayStatus === 'connected' ? '' : 'offline'}`} />
        <span className="sidebar-status-text">{gatewayStatus === 'connected'
          ? (apiDirect ? 'Nur-Chat-Modus eingerichtet' : agentRuntime !== 'openclaw' ? `${agentRuntime} CLI installiert` : 'Gateway verbunden')
          : gatewayStatus === 'disconnected'
            ? (apiDirect ? 'API-Einstellungen unvollständig' : agentRuntime !== 'openclaw' ? `${agentRuntime} CLI nicht eingerichtet` : 'Gateway offline')
            : 'Verbinde …'}</span>
        <button className="settings-gear" onClick={onOpenSettings} title="Einstellungen (Modelle · Umgebung · Mehr)">
          <IconGear size={13} /> Einstellungen
        </button>
      </div>
    </div>
  );
}

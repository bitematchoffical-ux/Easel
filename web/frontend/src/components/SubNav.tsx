import type { Page } from './Sidebar';
import type { ComponentType } from 'react';
import { IconDashboard, IconFire, IconIdea, IconCalendar, IconPublish, IconSkills } from './icons';

interface SubNavProps {
  current: Page;
  onNavigate: (page: Page) => void;
}

const TOOLS: { page: Page; Icon: ComponentType<{ size?: number }>; label: string }[] = [
  { page: 'trends', Icon: IconFire, label: 'Trend-Radar' },
  { page: 'ideas', Icon: IconIdea, label: 'Ideenpool' },
  { page: 'calendar', Icon: IconCalendar, label: 'Content-Kalender' },
  { page: 'publish', Icon: IconPublish, label: 'Veröffentlichen' },
  { page: 'breakdown', Icon: IconSkills, label: 'Viral-Analyse' },
];

export default function SubNav({ current, onNavigate }: SubNavProps) {
  return (
    <div className="subnav">
      <button className="subnav-back" onClick={() => onNavigate('dashboard')} title="Zurück zum Arbeitsbereich">
        <IconDashboard size={15} /> Arbeitsbereich
      </button>
      <span className="subnav-div" />
      <div className="subnav-tabs">
        {TOOLS.map(({ page, Icon, label }) => (
          <button key={page} className={`subnav-tab ${current === page ? 'active' : ''}`}
            onClick={() => onNavigate(page)}>
            <Icon size={14} />{label}
          </button>
        ))}
      </div>
    </div>
  );
}

import type { ViewName } from '../../App';
import { TournamentSwitcher } from './TournamentSwitcher';

const views: Array<{ id: ViewName; label: string }> = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'groups', label: 'Groups' },
  { id: 'fullBracket', label: 'Full Bracket' },
  { id: 'knockout', label: 'Knockout' },
  { id: 'finals', label: 'Finals' },
  { id: 'payout', label: 'Payout' },
  { id: 'rules', label: 'Rules' },
  { id: 'admin', label: 'Admin' },
];

export function NavBar({ activeView, onViewChange }: { activeView: ViewName; onViewChange: (view: ViewName) => void }) {
  return (
    <header className="topbar">
      <div className="topbar__main">
        <div>
          <p className="eyebrow">North Park</p>
          <h1>Disc Golf World Cup</h1>
        </div>
        <TournamentSwitcher />
      </div>
      <nav className="nav-tabs" aria-label="Main navigation">
        {views.map((view) => (
          <button
            className={activeView === view.id ? 'nav-tab nav-tab--active' : 'nav-tab'}
            key={view.id}
            onClick={() => onViewChange(view.id)}
            type="button"
          >
            {view.label}
          </button>
        ))}
      </nav>
    </header>
  );
}

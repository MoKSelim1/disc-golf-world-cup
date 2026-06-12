import { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { PassphraseGate } from '../components/admin/PassphraseGate';
import { PlayerGroupSetup } from '../components/admin/PlayerGroupSetup';
import { GroupScoreEntry } from '../components/admin/GroupScoreEntry';
import { KnockoutScoreEntry } from '../components/admin/KnockoutScoreEntry';
import { FinalStageScoreEntry } from '../components/admin/FinalStageScoreEntry';
import { PublishPanel } from '../components/admin/PublishPanel';
import { TournamentManager } from '../components/admin/TournamentManager';
import { RulesEditor } from '../components/admin/RulesEditor';

type AdminTab = 'tournaments' | 'players' | 'groups' | 'knockout' | 'finals' | 'rules' | 'publish';

const tabs: Array<{ id: AdminTab; label: string }> = [
  { id: 'tournaments', label: 'Tournaments' },
  { id: 'players', label: 'Players' },
  { id: 'groups', label: 'Group Scores' },
  { id: 'knockout', label: 'Knockout' },
  { id: 'finals', label: 'Finals' },
  { id: 'rules', label: 'Rules' },
  { id: 'publish', label: 'Publish' },
];

export function AdminPage() {
  const { isAdmin } = useTournament();
  const [tab, setTab] = useState<AdminTab>('tournaments');

  if (!isAdmin) return <PassphraseGate />;

  return (
    <div className="page-stack">
      <div className="admin-tabs">
        {tabs.map((item) => (
          <button
            className={tab === item.id ? 'nav-tab nav-tab--active' : 'nav-tab'}
            key={item.id}
            onClick={() => setTab(item.id)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>
      {tab === 'tournaments' && <TournamentManager />}
      {tab === 'players' && <PlayerGroupSetup />}
      {tab === 'groups' && <GroupScoreEntry />}
      {tab === 'knockout' && <KnockoutScoreEntry />}
      {tab === 'finals' && <FinalStageScoreEntry />}
      {tab === 'rules' && <RulesEditor />}
      {tab === 'publish' && <PublishPanel />}
    </div>
  );
}

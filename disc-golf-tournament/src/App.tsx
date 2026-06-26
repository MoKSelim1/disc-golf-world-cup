import { useState } from 'react';
import { Layout } from './components/layout/Layout';
import { useTournamentData } from './hooks/useTournamentData';
import { DashboardPage } from './pages/DashboardPage';
import { GroupsPage } from './pages/GroupsPage';
import { FullBracketPage } from './pages/FullBracketPage';
import { KnockoutPage } from './pages/KnockoutPage';
import { FinalStagePage } from './pages/FinalStagePage';
import { PayoutPage } from './pages/PayoutPage';
import { RulesPage } from './pages/RulesPage';
import { AdminPage } from './pages/AdminPage';
import { SiteGate } from './components/auth/SiteGate';

export type ViewName = 'dashboard' | 'groups' | 'fullBracket' | 'knockout' | 'finals' | 'payout' | 'rules' | 'admin';

function CurrentView({ view }: { view: ViewName }) {
  switch (view) {
    case 'groups':
      return <GroupsPage />;
    case 'fullBracket':
      return <FullBracketPage />;
    case 'knockout':
      return <KnockoutPage />;
    case 'finals':
      return <FinalStagePage />;
    case 'payout':
      return <PayoutPage />;
    case 'rules':
      return <RulesPage />;
    case 'admin':
      return <AdminPage />;
    case 'dashboard':
    default:
      return <DashboardPage />;
  }
}

export default function App() {
  const [view, setView] = useState<ViewName>('fullBracket');
  const status = useTournamentData();

  return (
    <SiteGate>
      <Layout activeView={view} onViewChange={setView}>
        {status === 'loading' ? <div className="panel">Loading tournament...</div> : <CurrentView view={view} />}
      </Layout>
    </SiteGate>
  );
}

import { useState } from 'react';
import { Layout } from './components/layout/Layout';
import { useTournamentData } from './hooks/useTournamentData';
import { DashboardPage } from './pages/DashboardPage';
import { GroupsPage } from './pages/GroupsPage';
import { KnockoutPage } from './pages/KnockoutPage';
import { FinalStagePage } from './pages/FinalStagePage';
import { PayoutPage } from './pages/PayoutPage';
import { RulesPage } from './pages/RulesPage';
import { AdminPage } from './pages/AdminPage';

export type ViewName = 'dashboard' | 'groups' | 'knockout' | 'finals' | 'payout' | 'rules' | 'admin';

function CurrentView({ view }: { view: ViewName }) {
  switch (view) {
    case 'groups':
      return <GroupsPage />;
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
  const [view, setView] = useState<ViewName>('dashboard');
  const status = useTournamentData();

  return (
    <Layout activeView={view} onViewChange={setView}>
      {status === 'loading' ? <div className="panel">Loading tournament...</div> : <CurrentView view={view} />}
    </Layout>
  );
}

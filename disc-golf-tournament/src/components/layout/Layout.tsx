import type { ReactNode } from 'react';
import type { ViewName } from '../../App';
import { NavBar } from './NavBar';

export function Layout({
  activeView,
  onViewChange,
  children,
}: {
  activeView: ViewName;
  onViewChange: (view: ViewName) => void;
  children: ReactNode;
}) {
  return (
    <div className="app-shell">
      <NavBar activeView={activeView} onViewChange={onViewChange} />
      <main>{children}</main>
    </div>
  );
}

import { useCallback, useState } from 'react';
import { BrowserRouter, Link, Route, Routes } from 'react-router';

import {
  CcaBanner,
  ChainGuard,
  ErrorBoundary,
  Header,
  Navigation,
} from './components/common';
import { LINKS, PAGE } from './lib/constants';
import {
  Bonding,
  Dashboard,
  Governance,
  Redemption,
  SystemParameters,
  Vesting,
} from './pages';

function App() {
  const [navOpen, setNavOpen] = useState(false);
  // Stable identity: Navigation closes itself whenever this callback changes.
  const closeNav = useCallback(() => setNavOpen(false), []);

  return (
    <BrowserRouter>
      <div className="bg-dark text-text selection:bg-orange/30 min-h-screen font-sans">
        <Navigation open={navOpen} onClose={closeNav} />

        <main className="flex min-h-dvh flex-col lg:pl-64">
          <Header onMenu={() => setNavOpen(true)} />

          <ChainGuard />

          <CcaBanner />

          <div className="animate-in fade-in flex-1 py-6 duration-300">
            <Routes>
              <Route
                index
                path={PAGE.DASHBOARD}
                element={
                  <ErrorBoundary section="dashboard">
                    <Dashboard />
                  </ErrorBoundary>
                }
              />
              <Route
                path={PAGE.BONDING}
                element={
                  <ErrorBoundary section="bonding">
                    <Bonding />
                  </ErrorBoundary>
                }
              />
              <Route
                path={PAGE.GOVERNANCE}
                element={
                  <ErrorBoundary section="governance">
                    <Governance />
                  </ErrorBoundary>
                }
              />
              <Route
                path={PAGE.REDEMPTION}
                element={
                  <ErrorBoundary section="redemption">
                    <Redemption />
                  </ErrorBoundary>
                }
              />
              <Route
                path={PAGE.SYSTEM_PARAMETERS}
                element={
                  <ErrorBoundary section="system parameters">
                    <SystemParameters />
                  </ErrorBoundary>
                }
              />
              <Route
                path={PAGE.VESTING}
                element={
                  <ErrorBoundary section="vesting">
                    <Vesting />
                  </ErrorBoundary>
                }
              />
            </Routes>
          </div>

          <footer className="border-border text-muted border-t p-6 text-center text-xs">
            <div className="mb-2 flex justify-center gap-6">
              <Link
                to={LINKS.TWITTER}
                className="transition-colors hover:text-white"
              >
                Twitter
              </Link>
              <Link
                to={LINKS.DISCORD}
                className="transition-colors hover:text-white"
              >
                Discord
              </Link>
              <Link
                to={LINKS.GITHUB}
                className="transition-colors hover:text-white"
              >
                Github
              </Link>
            </div>
            <p>© 2025 Bitcoin Strategy. All rights reserved.</p>
          </footer>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;

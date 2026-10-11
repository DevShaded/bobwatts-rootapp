import React, { lazy, Suspense, useEffect } from "react";
import { rootClient, type RootThemeMode } from "@rootsdk/client-app";
const WelcomeSettings = lazy(() => import("./WelcomeSettings"));

const App: React.FC = () => {
  const pathname = window.location.pathname.replace(/\/+$/, "") || "/";
  const isDashboard = pathname === "/";
  const isWelcome = pathname === "/management/welcome";
  useEffect(() => {
    const updateTheme = (theme: RootThemeMode) => {
      document.documentElement.dataset.theme = theme;
    };
    updateTheme(rootClient.theme.getTheme());
    rootClient.theme.on("theme.update", updateTheme);
    return () => {
      rootClient.theme.off("theme.update", updateTheme);
    };
  }, []);

  return (
    <div className="app-layout">
      <aside className="app-sidebar">
        <div className="sidebar-brand">
          <span className="brand-mark" aria-hidden="true">BW</span>
          <div>
            <p className="brand-name">Bob Watts</p>
            <p className="brand-description">Community tools</p>
          </div>
        </div>
        <nav aria-label="App navigation">
          <a href="/" className="sidebar-link sidebar-dashboard" aria-current={isDashboard ? "page" : undefined}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="7" height="7" rx="2" />
              <rect x="14" y="3" width="7" height="7" rx="2" />
              <rect x="3" y="14" width="7" height="7" rx="2" />
              <rect x="14" y="14" width="7" height="7" rx="2" />
            </svg>
            Dashboard
          </a>
          <h2 id="server-management-group" className="sidebar-group-heading">Server management</h2>
          <div role="group" aria-labelledby="server-management-group">
            <a
              href="/management/welcome"
              className="sidebar-link"
              aria-current={isWelcome ? "page" : undefined}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="5" width="18" height="14" rx="3" />
                <path d="m3 7 9 6 9-6" />
              </svg>
              Welcome
            </a>
          </div>
        </nav>
      </aside>
      <main className="app-shell" aria-labelledby="page-heading">
        <header className="app-heading">
          <p className="eyebrow">{isWelcome ? "Server management" : "Bob Watts"}</p>
          <h1 id="page-heading">{isDashboard ? "Dashboard" : isWelcome ? "Welcome messages" : "Page not found"}</h1>
          <p>{isDashboard ? "Manage your community with Bob Watts." : isWelcome ? "Give new members a warm welcome with a greeting in your community." : "This page does not exist."}</p>
        </header>
        {isWelcome ? (
          <Suspense fallback={<p role="status">Loading welcome settings…</p>}>
            <WelcomeSettings />
          </Suspense>
        ) : isDashboard ? null : (
          <a className="dashboard-return" href="/">Go to dashboard</a>
        )}
      </main>
    </div>
  );
};

export default App;

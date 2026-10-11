import React, { useEffect, useRef } from "react";
import { rootClient, type RootThemeMode } from "@rootsdk/client-app";
import { Button } from "./components/arc/button/button";
import WelcomeSettings from "./WelcomeSettings";

const App: React.FC = () => {
  const welcomeHeading = useRef<HTMLHeadingElement>(null);
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
          <h2 id="server-management-group" className="sidebar-group-heading">Server management</h2>
          <div role="group" aria-labelledby="server-management-group">
            <Button
              type="button"
              variant="ghost"
              className="sidebar-link"
              aria-current="page"
              aria-controls="welcome-page"
              onClick={() => welcomeHeading.current?.focus()}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="5" width="18" height="14" rx="3" />
                <path d="m3 7 9 6 9-6" />
              </svg>
              Welcome
            </Button>
          </div>
        </nav>
      </aside>
      <main id="welcome-page" className="app-shell" aria-labelledby="welcome-heading">
        <header className="app-heading">
          <p className="eyebrow">Server management</p>
          <h1 id="welcome-heading" ref={welcomeHeading} tabIndex={-1}>Welcome messages</h1>
          <p>Give new members a warm welcome with a greeting in your community.</p>
        </header>
        <WelcomeSettings />
      </main>
    </div>
  );
};

export default App;

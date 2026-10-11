import React, { useEffect } from "react";
import { rootClient, type RootThemeMode } from "@rootsdk/client-app";
import WelcomeSettings from "./WelcomeSettings";

const App: React.FC = () => {
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
    <main className="app-shell">
      <header className="app-heading">
        <p className="eyebrow">Bob Watts</p>
        <h1>Welcome messages</h1>
        <p>Give new members a warm welcome with a greeting in your community.</p>
      </header>
      <WelcomeSettings />
    </main>
  );
};

export default App;

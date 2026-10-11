import React, { useEffect } from "react";
import { rootClient, type RootThemeMode } from "@rootsdk/client-app";
import Echo from "./Example";

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
        <h1>Echo playground</h1>
        <p>Send a message and see it return. Other connected clients receive it too.</p>
      </header>
      <Echo />
    </main>
  );
};

export default App;

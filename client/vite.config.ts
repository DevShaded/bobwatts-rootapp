import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import checker from "vite-plugin-checker";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // DevHost ports can differ per project; the packaged client uses Root's native bridge.
  define: command === "serve" ? {
    "window.__rootDevConfig": JSON.stringify({
      wsPort: Number(process.env.VITE_ROOT_DEV_WS_PORT || 8080),
      httpPort: Number(process.env.VITE_ROOT_DEV_HTTP_PORT || 8081),
      wsUpdatePort: Number(process.env.VITE_ROOT_DEV_WS_UPDATE_PORT || 8082),
    }),
  } : {},
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
  },
  resolve: {
    // Hoisted Motion dependencies must use the client's React instance.
    dedupe: ["react", "react-dom"],
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  // HMR
  plugins: [react(), checker({ typescript: true })],
}));

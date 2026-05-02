import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // Must match server PORT (default 5000). Override in client/.env.development:
  // VITE_DEV_API_URL=http://127.0.0.1:5000
  const apiTarget = env.VITE_DEV_API_URL || "http://127.0.0.1:5000";
  return {
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": { target: apiTarget, changeOrigin: true },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
};
});

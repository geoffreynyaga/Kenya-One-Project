import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // Relative asset paths, so the bundle also resolves when it is not served
  // from a domain root.
  base: "./",
  plugins: [react()],
  server: {
    // tauri.conf.json names this port as devUrl.
    port: 3000,
    strictPort: true,
  },
  build: {
    // tauri.conf.json names this directory as frontendDist.
    outDir: "build",
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.js",
    css: true,
  },
});

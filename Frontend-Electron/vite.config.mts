import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // The packaged Electron app loads the bundle over file://, where absolute
  // asset paths do not resolve.
  base: "./",
  plugins: [react()],
  server: {
    // The Electron shell waits on this port before opening its window.
    port: 3000,
    strictPort: true,
  },
  build: {
    // public/electron.js loads ../build/index.html in a packaged app.
    outDir: "build",
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.js",
    css: true,
  },
});

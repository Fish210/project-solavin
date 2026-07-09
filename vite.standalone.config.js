import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// Standalone build → dist-standalone/index.html, a single self-contained file
// with all JS/CSS inlined. Drop it anywhere (email, USB, file://) and it runs
// offline — no server required. Built with: npm run build:standalone
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  base: "./",
  build: {
    outDir: "dist-standalone",
    target: "es2019",
    cssCodeSplit: false,
    assetsInlineLimit: 100000000,
    chunkSizeWarningLimit: 100000000,
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
});

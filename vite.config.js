import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Standard production build → dist/ (deployed to Netlify / static hosting).
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "dist",
    sourcemap: true,
    target: "es2019",
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.js"],
  },
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import purgecss from "@fullhuman/postcss-purgecss";

// PurgeCSS runs only on production builds. landing.css carried ~6k lines of dead
// rules from past redesigns; this drops the unused ones so the render-blocking
// CSS on every page is much smaller. Classes that are built at runtime (numbered
// dev-chips, review columns, JS-toggled state classes) are safelisted so they're
// never stripped. Keyframes/font-face are left untouched (default) to be safe.
const purge = purgecss({
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  defaultExtractor: (content) => content.match(/[A-Za-z0-9_-]+/g) || [],
  safelist: {
    standard: [
      "in", "theme-cream", "page-fade",
      "flip", "open", "scrolled", "soon", "visible", "live", "idea",
      "user", "assistant", "askai-typing",
      "current", "on", "active", "b", "c",
      "reveal", "reveal-sm", "reveal-scale",
    ],
    greedy: [/^c\d+$/],
  },
});

export default defineConfig(({ command }) => ({
  plugins: [react()],
  css: {
    postcss: {
      plugins: command === "build" ? [purge] : [],
    },
  },
  server: {
    host: true,
  },
}));

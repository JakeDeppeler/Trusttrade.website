// Prerender the landing route to static HTML so the hero is in the initial HTML
// response — mobile FCP/LCP no longer wait for the app JS to download + execute.
// Runs AFTER `vite build` (which produced dist/ with an empty <div id="root">).
// It builds a server bundle from src/entry-server.jsx, renders each route to an
// HTML string, and injects it into the built template. The client then hydrates.
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "vite";
import Beasties from "beasties";

const root = process.cwd();
const dist = path.join(root, "dist");
const ssrDir = path.join(root, ".ssr-build");
const ROUTES = ["/"]; // only "/" is eager; other routes stay client-rendered

// 1. Build the SSR bundle (inherits vite.config.js: react plugin, etc.).
await build({
  logLevel: "warn",
  build: {
    ssr: "src/entry-server.jsx",
    outDir: ".ssr-build",
    emptyOutDir: true,
    rollupOptions: { output: { entryFileNames: "entry-server.js" } },
  },
});

// 2. Render each route and inject into the built template.
const { render } = await import(pathToFileURL(path.join(ssrDir, "entry-server.js")).href);
const template = fs.readFileSync(path.join(dist, "index.html"), "utf8");
const MARKER = '<div id="root"></div>';
if (!template.includes(MARKER)) {
  console.error("prerender: empty " + MARKER + " not found in dist/index.html — aborting.");
  process.exit(1);
}

// Keep the ORIGINAL empty-root template as the SPA fallback shell. index.html now
// carries prerendered HOMEPAGE markup, so the Vercel catch-all must serve this empty
// shell for non-home routes instead — otherwise a direct hit on /faq would try to
// hydrate homepage HTML and mismatch. vercel.json rewrites the catch-all to /_shell.html.
fs.writeFileSync(path.join(dist, "_shell.html"), template);
console.log("wrote dist/_shell.html (empty-root SPA fallback)");
// Inline the CSS actually used by the prerendered HTML into <style> in the <head>,
// and switch the external stylesheet to a non-blocking async load. This removes the
// render-blocking CSS round-trip that was gating mobile FCP — first paint now happens
// as soon as the HTML arrives. Only run on the prerendered homepage (it needs real DOM
// to know which rules are critical); the SPA _shell keeps its normal blocking link.
const beasties = new Beasties({
  path: dist,
  publicPath: "/",
  preload: "swap", // non-critical CSS: <link rel=preload ... onload="this.rel='stylesheet'">
  pruneSource: false, // keep the full stylesheet intact for the async load
  logLevel: "warn",
});

for (const url of ROUTES) {
  const appHtml = render(url);
  if (!appHtml || appHtml.length < 500) {
    console.error(`prerender: ${url} produced suspiciously small HTML (${appHtml && appHtml.length} bytes) — aborting.`);
    process.exit(1);
  }
  const out = template.replace(MARKER, `<div id="root">${appHtml}</div>`);
  let finalHtml;
  try {
    finalHtml = await beasties.process(out);
    if (!/<style/.test(finalHtml)) throw new Error("no inline <style> produced");
  } catch (e) {
    console.error(`prerender: critical-CSS inline failed for ${url} (${e.message}) — using non-inlined HTML.`);
    finalHtml = out;
  }
  const file = url === "/" ? path.join(dist, "index.html") : path.join(dist, url.replace(/^\//, ""), "index.html");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, finalHtml);
  console.log(`prerendered ${url} → ${path.relative(root, file)} (${appHtml.length} bytes hero HTML, ${Math.round(finalHtml.length / 1024)}KB total)`);
}

// 3. Clean up the throwaway server bundle.
fs.rmSync(ssrDir, { recursive: true, force: true });

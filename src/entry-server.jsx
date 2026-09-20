import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import AppRoutes from "./AppRoutes.jsx";

// Re-export the per-route <head> metadata so the prerender script can stamp the
// correct title / description / canonical / OG tags into each route's static HTML.
export { ROUTE_META } from "./components/Seo.jsx";

// Prerender entry (Node, no DOM). scripts/prerender.mjs builds this, renders the
// given route to a static HTML string, and injects it into the route's #root so
// the content is in the initial response, then the client hydrates it. Keep
// everything here import-safe — no browser globals at render time.
//
// Every route except "/" is React.lazy(), and renderToString is synchronous, so
// the first pass only emits the Suspense fallback while the dynamic import is in
// flight. We render, let the import resolve on a macrotask, then render again,
// repeating until the output stops growing (covers nested lazy). The module graph
// is already built, so each import settles in ~1 tick.
export async function render(url) {
  const el = (
    <StaticRouter location={url}>
      <AppRoutes />
    </StaticRouter>
  );
  let html = renderToString(el);
  for (let i = 0; i < 10; i++) {
    await new Promise((r) => setTimeout(r, 0));
    const next = renderToString(el);
    if (next.length === html.length) {
      html = next;
      break;
    }
    html = next;
  }
  return html;
}

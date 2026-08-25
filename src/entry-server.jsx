import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import AppRoutes from "./AppRoutes.jsx";

// Prerender entry (Node, no DOM). scripts/prerender.mjs builds this, renders the
// given route to a static HTML string, and injects it into dist/index.html's #root
// so the hero is in the initial response (fast mobile FCP/LCP), then the client
// hydrates it. Keep everything here import-safe — no browser globals at render time.
export function render(url) {
  return renderToString(
    <StaticRouter location={url}>
      <AppRoutes />
    </StaticRouter>
  );
}

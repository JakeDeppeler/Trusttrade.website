import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./AppRoutes.jsx";
import "./styles/landing.css";
import "./styles/pages.css";
import "./styles/chrome.css";

// Marketing site runs on the cream-primary/dark-accent inversion of the app's
// brand palette. Guarded so the module is import-safe during the SSR/prerender
// pass (no `document` there); on the client this runs before first paint.
if (typeof document !== "undefined") {
  document.body.classList.add("theme-cream");
}

const app = (
  <React.StrictMode>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </React.StrictMode>
);

const root = document.getElementById("root");
// "/" is prerendered to static HTML (scripts/prerender.mjs) so the hero paints
// before this JS runs — hydrate it. Other routes ship an empty #root — mount fresh.
if (root.hasChildNodes()) {
  ReactDOM.hydrateRoot(root, app);
} else {
  ReactDOM.createRoot(root).render(app);
}

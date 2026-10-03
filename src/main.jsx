import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./AppRoutes.jsx";
import "./styles/fonts.css";
import "./styles/site.css";

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

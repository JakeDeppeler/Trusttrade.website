import React, { Suspense, lazy, useRef } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ScrollToTop } from "./components/PageChrome.jsx";
import Seo from "./components/Seo.jsx";
// Homepage loads eagerly (it's the LCP route + most traffic). Every other route
// is code-split into its own chunk so it's only downloaded when visited — this
// keeps the initial JS payload small (PageSpeed "reduce unused JavaScript").
import LandingPage from "./pages/LandingPage.jsx";
const HowItWorksPage = lazy(() => import("./pages/HowItWorksPage.jsx"));
const VerifyPage = lazy(() => import("./pages/VerifyPage.jsx"));
const ForTradiesPage = lazy(() => import("./pages/ForTradiesPage.jsx"));
const ForHomeownersPage = lazy(() => import("./pages/ForHomeownersPage.jsx"));
const TradesPage = lazy(() => import("./pages/TradesPage.jsx"));
const FAQPage = lazy(() => import("./pages/FAQPage.jsx"));
const AboutPage = lazy(() => import("./pages/AboutPage.jsx"));
const OurStoryPage = lazy(() => import("./pages/OurStoryPage.jsx"));
const ToolsPage = lazy(() => import("./pages/ToolsPage.jsx"));
import "./styles/landing.css";
import "./styles/pages.css";
import "./styles/chrome.css";

// Marketing site runs on the cream-primary/dark-accent inversion of the
// app's brand palette. Set once at boot so every page inherits — do it
// before the first render so there's no theme flash.
document.body.classList.add("theme-cream");

// Fade each page in on navigation so route changes flow more smoothly.
// Keyed by pathname so the animation replays on every route change.
// IMPORTANT: the fade animates from opacity:0, which makes the hero (the LCP
// element) invisible for ~1s on the very first paint — Lighthouse then can't
// register any Largest Contentful Paint (NO_LCP). So skip the fade on the
// initial load; only run it on subsequent client-side route changes.
function AnimatedRoutes() {
  const location = useLocation();
  const firstRef = useRef(true);
  const cls = firstRef.current ? undefined : "page-fade";
  firstRef.current = false;
  return (
    <div className={cls} key={location.pathname}>
      <Suspense fallback={null}>
      <Routes location={location}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/how-we-verify" element={<VerifyPage />} />
        <Route path="/for-tradies" element={<ForTradiesPage />} />
        <Route path="/for-homeowners" element={<ForHomeownersPage />} />
        <Route path="/trades" element={<TradesPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/our-story" element={<OurStoryPage />} />
        <Route path="/tools" element={<ToolsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ScrollToTop />
      <Seo />
      <AnimatedRoutes />
    </BrowserRouter>
  </React.StrictMode>
);

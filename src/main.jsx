import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ScrollToTop } from "./components/PageChrome.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import HowItWorksPage from "./pages/HowItWorksPage.jsx";
import VerifyPage from "./pages/VerifyPage.jsx";
import ForTradiesPage from "./pages/ForTradiesPage.jsx";
import ForHomeownersPage from "./pages/ForHomeownersPage.jsx";
import TradesPage from "./pages/TradesPage.jsx";
import FAQPage from "./pages/FAQPage.jsx";
import AboutPage from "./pages/AboutPage.jsx";
import OurStoryPage from "./pages/OurStoryPage.jsx";
import ToolsPage from "./pages/ToolsPage.jsx";
import "./styles/landing.css";
import "./styles/pages.css";
import "./styles/chrome.css";

// Marketing site runs on the cream-primary/dark-accent inversion of the
// app's brand palette. Set once at boot so every page inherits — do it
// before the first render so there's no theme flash.
document.body.classList.add("theme-cream");

// Fade each page in on navigation so route changes flow more smoothly.
// Keyed by pathname so the animation replays on every route change.
function AnimatedRoutes() {
  const location = useLocation();
  return (
    <div className="page-fade" key={location.pathname}>
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
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ScrollToTop />
      <AnimatedRoutes />
    </BrowserRouter>
  </React.StrictMode>
);

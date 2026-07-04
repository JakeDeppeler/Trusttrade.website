import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import "./styles/landing.css";
import "./styles/pages.css";
import "./styles/chrome.css";

// Marketing site runs on the cream-primary/dark-accent inversion of the
// app's brand palette. Set once at boot so every page inherits — do it
// before the first render so there's no theme flash.
document.body.classList.add("theme-cream");

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/how-we-verify" element={<VerifyPage />} />
        <Route path="/for-tradies" element={<ForTradiesPage />} />
        <Route path="/for-homeowners" element={<ForHomeownersPage />} />
        <Route path="/trades" element={<TradesPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/our-story" element={<OurStoryPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

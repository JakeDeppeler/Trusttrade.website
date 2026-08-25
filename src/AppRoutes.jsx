import { Suspense, lazy, useRef } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ScrollToTop } from "./components/PageChrome.jsx";
import Seo from "./components/Seo.jsx";
// Homepage loads eagerly (it's the LCP route + most traffic, and the only route we
// prerender). Every other route is code-split into its own chunk so it's only
// downloaded when visited — this keeps the initial JS payload small.
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

// Fade each page in on navigation so route changes flow more smoothly.
// IMPORTANT: the fade animates from opacity:0, which makes the hero (the LCP
// element) invisible for ~1s on the very first paint — Lighthouse then can't
// register any Largest Contentful Paint (NO_LCP). So skip the fade on the
// initial load (and during SSR); only run it on subsequent client route changes.
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

// The app tree WITHOUT a router — the client wraps it in <BrowserRouter>, the
// prerender wraps it in <StaticRouter>. Shared so both render identical markup.
export default function AppRoutes() {
  return (
    <>
      <ScrollToTop />
      <Seo />
      <AnimatedRoutes />
    </>
  );
}

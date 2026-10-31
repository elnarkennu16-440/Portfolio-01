/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "./hooks/useTheme";
import { IntroLoader } from "./components/IntroLoader/IntroLoader";
import { Navbar } from "./components/Navbar/Navbar";
import { Hero } from "./sections/Hero/Hero";
import { About } from "./sections/About/About";
import { Works } from "./sections/Works/Works";
import { ViewAllProjects } from "./sections/Works/ViewAllProjects";
import { Capabilities } from "./sections/Capabilities/Capabilities";
import { ProfessionalOverview } from "./sections/ProfessionalOverview/ProfessionalOverview";
import { Experience } from "./sections/ProfessionalOverview/Experience/Experience";
import { Workflows } from "./sections/ProfessionalOverview/Workflows/Workflows";
import { Services } from "./sections/ProfessionalOverview/Services/Services";
import { Resume } from "./sections/Resume/Resume";
import { PreFooterBanner } from "./sections/PreFooterBanner/PreFooterBanner";
import { Footer } from "./sections/Footer/Footer";
import { ContactModal } from "./components/ContactModal/ContactModal";
import { Chatbot } from "./components/Chatbot/Chatbot";
import { LiveViewTracker } from "./components/LiveViewTracker/LiveViewTracker";

/* ── Hero → About → Works scroll feel ───────────────────────────────────────
 * Before: About was fully visible at ONE scroll position only (Works started to
 * cover it the very next pixel), so with trackpad / finger momentum it flew past.
 * ABOUT_HOLD_VH adds a real resting zone (in screens of scroll) in which About is
 * completely uncovered and centred. Everything after Works simply starts that much
 * further down the page. Raise it for a longer rest, lower it for a shorter one.
 * SETTLE_ASSIST gently catches you when you stop just before / after that zone. */
const ABOUT_HOLD_VH = 80;
const SETTLE_ASSIST = true;
const SETTLE_IDLE_MS = 170; // how long the scroll must be still before the catch
const SETTLE_REACH = 0.22; // how close (in screens) to the zone the catch works

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [isViewAllProjectsOpen, setIsViewAllProjectsOpen] = useState(false);
  const [activeSubpage, setActiveSubpage] = useState<
    "experience" | "workflows" | "services" | "resume" | null
  >(null);

  // Hero -> About -> Works "folder" stack (see the wrapper in the JSX below)
  const stackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const wrapper = stackRef.current;
    const track = document.getElementById("about");
    const works = document.getElementById("works");
    const hero = document.getElementById("hero");
    const about = track ? track.querySelector("section") : null;
    if (!wrapper || !track || !works || !hero || !about) return;

    const DIM = 0.75; // how dark a section gets once the next one has covered it
    const PAUSE_AT = -0.5; // pause when the cover edge is 0.5 screen above the top...
    const RESUME_AT = -0.3; // ...wake up again 0.3 screen BEFORE it is uncovered (still hidden)
    const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

    let raf = 0;
    let lastHeroDim = "";
    let lastAboutDim = "";
    let lastRound = "";
    let heroCovered = false;
    let aboutCovered = false;

    const setCovered = (el: Element, name: string, covered: boolean) => {
      if (covered) el.setAttribute("data-covered", "true");
      else el.removeAttribute("data-covered");
      // hook for the 3D scenes: window.addEventListener("stack:covered", ...)
      window.dispatchEvent(
        new CustomEvent("stack:covered", {
          detail: { section: name, covered },
        }),
      );
    };

    const update = () => {
      raf = 0;
      const vh = window.innerHeight || 1;
      const heroH = hero.offsetHeight || vh;
      const trackTop = track.getBoundingClientRect().top;
      const worksTop = works.getBoundingClientRect().top;

      // 0 -> 1 while About rises over Hero / Works rises over About
      const aboutP = clamp01(1 - trackTop / heroH);
      const worksP = clamp01(1 - worksTop / vh);

      const heroDim = (aboutP * DIM).toFixed(3);
      const aboutDim = (worksP * DIM).toFixed(3);
      // About's rounded corners flatten out as it settles at the top of the screen
      const round = clamp01((1 - aboutP) / 0.3).toFixed(3);

      if (heroDim !== lastHeroDim) {
        lastHeroDim = heroDim;
        wrapper.style.setProperty("--hero-dim", heroDim);
      }
      if (aboutDim !== lastAboutDim) {
        lastAboutDim = aboutDim;
        wrapper.style.setProperty("--about-dim", aboutDim);
      }
      if (round !== lastRound) {
        lastRound = round;
        wrapper.style.setProperty("--about-round", round);
      }

      // Fully covered sections stop rendering (nothing moves behind the cover);
      // they wake up again slightly before they come back into view.
      const nextHero = heroCovered
        ? trackTop / vh < RESUME_AT
        : trackTop / vh <= PAUSE_AT;
      const nextAbout = aboutCovered
        ? worksTop / vh < RESUME_AT
        : worksTop / vh <= PAUSE_AT;
      if (nextHero !== heroCovered) {
        heroCovered = nextHero;
        setCovered(hero, "hero", heroCovered);
      }
      if (nextAbout !== aboutCovered) {
        aboutCovered = nextAbout;
        setCovered(about, "about", aboutCovered);
      }
    };

    const schedule = () => {
      if (!raf) raf = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (raf) window.cancelAnimationFrame(raf);
      hero.removeAttribute("data-covered");
      about.removeAttribute("data-covered");
    };
  }, []);

  // Gentle "catch": if you stop scrolling just short of About's resting zone (coming
  // from Hero) or just below it (coming back from Works), ease into the zone.
  // Never fights you when you are leaving About, never while a finger is on screen.
  useEffect(() => {
    if (!SETTLE_ASSIST) return;
    const track = document.getElementById("about");
    const works = document.getElementById("works");
    if (!track || !works) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let timer = 0;
    let lastY = window.scrollY;
    let dir = 0; // 1 = scrolling down, -1 = up
    let touching = false;

    const settle = () => {
      if (touching) {
        timer = window.setTimeout(settle, SETTLE_IDLE_MS);
        return;
      }
      const y = window.scrollY;
      const vh = window.innerHeight || 1;
      const start = track.getBoundingClientRect().top + y; // About has just settled
      const end = works.getBoundingClientRect().top + y - vh; // Works starts to cover it
      const span = end - start;
      if (span < vh * 0.2) return;
      const inset = Math.min(span * 0.15, vh * 0.12);
      const reach = vh * SETTLE_REACH;
      let target: number | null = null;
      if (dir > 0 && y > start - reach && y < start) target = start + inset;
      else if (dir < 0 && y > end && y < end + reach) target = end - inset;
      if (target !== null) window.scrollTo({ top: target, behavior: "smooth" });
    };
    const onScroll = () => {
      const y = window.scrollY;
      if (y !== lastY) dir = y > lastY ? 1 : -1;
      lastY = y;
      window.clearTimeout(timer);
      timer = window.setTimeout(settle, SETTLE_IDLE_MS);
    };
    const down = () => {
      touching = true;
    };
    const up = () => {
      touching = false;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("touchstart", down, { passive: true });
    window.addEventListener("touchend", up, { passive: true });
    window.addEventListener("touchcancel", up, { passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("touchstart", down);
      window.removeEventListener("touchend", up);
      window.removeEventListener("touchcancel", up);
    };
  }, []);

  const handleOpenContact = () => {
    setIsContactModalOpen(true);
  };

  const handleCloseContact = () => {
    setIsContactModalOpen(false);
  };

  const handleOpenViewAllProjects = () => {
    setIsViewAllProjectsOpen(true);
  };

  const handleCloseViewAllProjects = () => {
    setIsViewAllProjectsOpen(false);
  };

  const handleOpenSubpage = (
    subpage: "experience" | "workflows" | "services" | "resume",
  ) => {
    setActiveSubpage(subpage);
  };

  const handleCloseSubpage = () => {
    setActiveSubpage(null);
  };

  // Called after loader has fully finished
  const handleCompleteIntro = () => {
    setShowIntro(false);
  };

  const isAnyOverlayActive =
    isContactModalOpen || isViewAllProjectsOpen || Boolean(activeSubpage);

  return (
    <>
      {/* Smooth Minimalist Black Loading Introduction */}
      {showIntro && (
        <IntroLoader durationMs={2000} onComplete={handleCompleteIntro} />
      )}

      <div
        className="portfolioRoot"
        inert={isAnyOverlayActive ? true : undefined}
        aria-hidden={isAnyOverlayActive}
      >
        <a href="#main-content" className="skipToContent">
          Skip to content
        </a>

        {/* Floating Navbar */}
        <Navbar
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenContact={handleOpenContact}
          onOpenSubpage={handleOpenSubpage}
        />

        <main id="main-content" tabIndex={-1}>
          {/* Wrapper para sa Hero -> About -> Works "folder" stacking:
              - Hero is sticky (stays behind)
              - About is sticky inside its own track (stays steady while Works rises over it)
              - the track gives About 100vh of extra "hold" scroll (+ ABOUT_HOLD_VH of
                resting zone, see the constant on top); marginBottom pulls the
                sections below back up by that same 100vh, so Works starts exactly where
                About's hold begins and NOTHING after Works is shifted or lengthened. */}
          <div
            ref={stackRef}
            className="heroAboutWrapper"
            style={{
              position: "relative",
              width: "100%",
              marginBottom: "-100vh",
            }}
          >
            {/* Hero Section */}
            <Hero isIntroDone={!showIntro} />

            {/* About Section: the track (NOT sticky) owns the #about anchor so nav links
                still scroll to the right place even while About is stuck */}
            <div
              id="about"
              style={{
                position: "relative",
                width: "100%",
                height: `calc(200vh + ${ABOUT_HOLD_VH}vh)`,
              }}
            >
              <About />
            </div>
          </div>

          {/* Works Section with VIEW ALL PROJECTS button */}
          <Works onOpenAllProjects={handleOpenViewAllProjects} />

          {/* Capabilities Section */}
          <Capabilities />

          {/* Philosophy / Scroll-Switching Statement Section */}
          <PreFooterBanner
            onOpenContact={handleOpenContact}
            onOpenSubpage={handleOpenSubpage}
          />

          {/* PROFESIONAL OVERVIEW (Replaces Process) */}
          <ProfessionalOverview onOpenSubpage={handleOpenSubpage} />
        </main>

        {/* Footer */}
        <Footer
          onOpenContact={handleOpenContact}
          onOpenSubpage={handleOpenSubpage}
          onOpenAllProjects={handleOpenViewAllProjects}
        />
      </div>

      {isViewAllProjectsOpen && (
        <ViewAllProjects
          onBack={handleCloseViewAllProjects}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}

      {/* Standalone Subpage Overlays for PROFESIONAL OVERVIEW */}
      {activeSubpage === "experience" && (
        <Experience
          onBack={handleCloseSubpage}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}

      {activeSubpage === "workflows" && (
        <Workflows
          onBack={handleCloseSubpage}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}

      {activeSubpage === "services" && (
        <Services
          onBack={handleCloseSubpage}
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenContact={handleOpenContact}
        />
      )}

      {/* Standalone Curriculum Vitae / Resume Subpage */}
      {activeSubpage === "resume" && (
        <Resume
          onBack={handleCloseSubpage}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}

      {/* Accessible Contact Modal */}
      <ContactModal isOpen={isContactModalOpen} onClose={handleCloseContact} />
      {/* Floating Real-Time Live Presence Tracker (Docked next to Chatbot) */}
      <LiveViewTracker />

      {/* Floating AI / Auto Messenger Chatbot */}
      <Chatbot />
    </>
  );
}

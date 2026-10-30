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
              - the track gives About 100vh of extra "hold" scroll; marginBottom pulls the
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
              style={{ position: "relative", width: "100%", height: "200vh" }}
            >
              <About />
            </div>
          </div>

          {/* Works Section with VIEW ALL PROJECTS button */}
          <Works onOpenAllProjects={handleOpenViewAllProjects} />

          {/* Capabilities Section */}
          <Capabilities />

          {/* PROFESIONAL OVERVIEW (Replaces Process) */}
          <ProfessionalOverview onOpenSubpage={handleOpenSubpage} />

          {/* Philosophy / Scroll-Switching Statement Section */}
          <PreFooterBanner
            onOpenContact={handleOpenContact}
            onOpenSubpage={handleOpenSubpage}
          />
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

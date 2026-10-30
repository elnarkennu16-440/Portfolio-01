/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
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
          {/* Eksklusibong Wrapper para sa Hero at About sticky/folder transition lang */}
          <div
            className="heroAboutWrapper"
            style={{ position: "relative", width: "100%" }}
          >
            {/* Hero Section */}
            <Hero isIntroDone={!showIntro} />

            {/* About Section */}
            <About />
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

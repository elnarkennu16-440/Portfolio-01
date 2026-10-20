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
import { TechMarquee } from "./components/TechMarquee/TechMarquee";
import { Works } from "./sections/Works/Works";
import { ViewAllProjects } from "./sections/Works/ViewAllProjects";
import { Capabilities } from "./sections/Capabilities/Capabilities";
import { Process } from "./sections/Process/Process";
import { Philosophy } from "./sections/Philosophy/Philosophy";
import { Footer } from "./sections/Footer/Footer";
import { ContactModal } from "./components/ContactModal/ContactModal";
import { Chatbot } from "./components/Chatbot/Chatbot";

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [isViewAllProjectsOpen, setIsViewAllProjectsOpen] = useState(false);

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
    // Smoothly scroll back to the works section
    setTimeout(() => {
      const worksEl = document.getElementById("works");
      if (worksEl) {
        worksEl.scrollIntoView({ behavior: "smooth" });
      }
    }, 50);
  };

  // Called after loader has fully finished
  const handleCompleteIntro = () => {
    setShowIntro(false);
  };

  return (
    <>
      {/* Smooth Minimalist Black Loading Introduction */}
      {showIntro && (
        <IntroLoader durationMs={2000} onComplete={handleCompleteIntro} />
      )}

      {isViewAllProjectsOpen ? (
        <ViewAllProjects
          onBack={handleCloseViewAllProjects}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      ) : (
        <div
          className="portfolioRoot"
          inert={isContactModalOpen ? true : undefined}
          aria-hidden={isContactModalOpen}
        >
          <a href="#main-content" className="skipToContent">
            Skip to content
          </a>

          {/* Floating Navbar */}
          <Navbar
            theme={theme}
            onToggleTheme={toggleTheme}
            onOpenContact={handleOpenContact}
          />

          <main id="main-content" tabIndex={-1}>
            {/* Hero Section */}
            <Hero isIntroDone={!showIntro} />

            {/* About Section */}
            <About />

            {/* Tech Stack Sliding Loop with Wave Spin Icons */}
            <TechMarquee />

            {/* Works Section with VIEW ALL PROJECTS button */}
            <Works onOpenAllProjects={handleOpenViewAllProjects} />

            {/* Capabilities Section */}
            <Capabilities />

            {/* Process Section */}
            <Process />

            {/* Philosophy / Scroll-Switching Statement Section */}
            <Philosophy />
          </main>

          {/* Footer */}
          <Footer onOpenContact={handleOpenContact} />
        </div>
      )}

      {/* Accessible Contact Modal */}
      <ContactModal isOpen={isContactModalOpen} onClose={handleCloseContact} />

      {/* Floating AI / Auto Messenger Chatbot */}
      <Chatbot />
    </>
  );
}

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
import { Capabilities } from "./sections/Capabilities/Capabilities";
import { Process } from "./sections/Process/Process";
import { Philosophy } from "./sections/Philosophy/Philosophy";
import { Footer } from "./sections/Footer/Footer";
import { ContactModal } from "./components/ContactModal/ContactModal";

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  const handleOpenContact = () => {
    setIsContactModalOpen(true);
  };

  const handleCloseContact = () => {
    setIsContactModalOpen(false);
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
          <Hero />

          {/* About Section */}
          <About />

          {/* Tech Stack Sliding Loop with Wave Spin Icons */}
          <TechMarquee />

          {/* Works Section */}
          <Works />

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

      {/* Accessible Contact Modal */}
      <ContactModal isOpen={isContactModalOpen} onClose={handleCloseContact} />
    </>
  );
}

import React, { useState, useEffect } from "react";
import { siteContent } from "../../content/siteContent";
import { ThemeToggle } from "../ThemeToggle/ThemeToggle";
import type { Theme } from "../../hooks/useTheme";
import logoImg from "../../assets/Minimalist-KennuLogo-.png";
import styles from "./Navbar.module.css";

interface NavbarProps {
  theme: Theme;
  onToggleTheme: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  onOpenContact?: () => void;
}

const SIGNAL_PATHS: string[] = [
  // 0: ABOUT - High dramatic spike reaching high up to Y=2 (height=36, baseline=18)
  "M 0 18 L 30 18 L 38 14 L 44 21 L 52 2 L 60 27 L 68 11 L 76 18 L 160 18 L 190 18 L 198 14 L 204 21 L 212 2 L 220 27 L 228 11 L 236 18 L 320 18 L 350 18 L 358 14 L 364 21 L 372 2 L 380 27 L 388 11 L 396 18 L 480 18",
  // 1: WORKS - Medium-high sharp peak to Y=5 with dampening
  "M 0 18 L 40 18 L 46 23 L 52 5 L 58 25 L 64 13 L 70 18 L 160 18 L 200 18 L 206 23 L 212 5 L 218 25 L 224 13 L 230 18 L 320 18 L 360 18 L 366 23 L 372 5 L 378 25 L 384 13 L 390 18 L 480 18",
  // 2: CAPABILITIES - Varied frequency rhythm with multiple peaks
  "M 0 18 L 20 18 L 26 11 L 32 23 L 38 8 L 44 20 L 50 14 L 56 18 L 85 18 L 91 9 L 97 26 L 103 18 L 160 18 L 180 18 L 186 11 L 192 23 L 198 8 L 204 20 L 210 14 L 216 18 L 245 18 L 251 9 L 257 26 L 263 18 L 320 18 L 340 18 L 346 11 L 352 23 L 358 8 L 364 20 L 370 14 L 376 18 L 405 18 L 411 9 L 417 26 L 423 18 L 480 18",
  // 3: PROCESS - Deep downward spike shooting down to Y=35 plus sharp rebound
  "M 0 18 L 25 18 L 32 13 L 38 21 L 44 9 L 50 35 L 56 6 L 62 20 L 68 18 L 160 18 L 185 18 L 192 13 L 198 21 L 204 9 L 210 35 L 216 6 L 222 20 L 228 18 L 320 18 L 345 18 L 352 13 L 358 21 L 364 9 L 370 35 L 376 6 L 382 20 L 388 18 L 480 18",
];

export const Navbar: React.FC<NavbarProps> = ({
  theme,
  onToggleTheme,
  onOpenContact,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("hero");

  // Track active section via IntersectionObserver
  useEffect(() => {
    const sectionIds = ["hero", "about", "works", "capabilities", "process"];
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-20% 0px -50% 0px",
        threshold: 0.1,
      },
    );

    elements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, []);

  // Close mobile drawer on resize to desktop or on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    const handleResize = () => {
      if (window.innerWidth >= 768 && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
    };
  }, [mobileMenuOpen]);

  const handleNavClick = () => {
    if (mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        {/* Brand Logo Zone */}
        <a
          href="#hero"
          className={styles.brand}
          aria-label={`${siteContent.meta.name} Portfolio Homepage`}
        >
          <img
            src={logoImg}
            alt="Kennu Logo"
            className={styles.brandLogo}
            width={469}
            height={126}
            loading="eager"
          />
        </a>

        {/* Right Zone: Navigation Links positioned beside Dark Mode Toggle & Actions */}
        <div className={styles.rightGroup}>
          <nav aria-label="Main Navigation" className={styles.desktopNav}>
            <ul className={styles.navLinks}>
              {siteContent.navigation.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <li key={item.id}>
                    <a
                      href={item.href}
                      className={`${styles.navLink} ${isActive ? styles.navLinkActive : ""}`}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {item.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Primary Actions: Theme Toggle & "Let's talk" */}
          <div className={styles.actions}>
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />

            <button
              type="button"
              className={`pillButton ${styles.talkButton}`}
              onClick={onOpenContact}
              aria-haspopup="dialog"
            >
              <span>Let's talk</span>
              <span className="arrow" aria-hidden="true">
                →
              </span>
            </button>

            {/* Accessible Mobile Menu Toggle */}
            <button
              type="button"
              className={styles.mobileMenuBtn}
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
              aria-label={
                mobileMenuOpen
                  ? "Close navigation menu"
                  : "Open navigation menu"
              }
            >
              <span
                className={`${styles.hamburgerLine} ${
                  mobileMenuOpen ? styles.hamburgerLineActiveTop : ""
                }`}
              />
              <span
                className={`${styles.hamburgerLine} ${
                  mobileMenuOpen ? styles.hamburgerLineActiveMid : ""
                }`}
              />
              <span
                className={`${styles.hamburgerLine} ${
                  mobileMenuOpen ? styles.hamburgerLineActiveBottom : ""
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Accessible Mobile Drawer */}
      <div
        id="mobile-navigation"
        className={`${styles.mobileDrawer} ${
          mobileMenuOpen ? styles.mobileDrawerOpen : ""
        }`}
        aria-hidden={!mobileMenuOpen}
      >
        <ul className={styles.mobileNavLinks}>
          {siteContent.navigation.map((item, index) => (
            <li key={item.id} className={styles.mobileNavItem}>
              <a
                href={item.href}
                className={styles.mobileNavLink}
                onClick={handleNavClick}
              >
                <div className={styles.mobileNavRow}>
                  <span className={styles.mobileNavText}>{item.label}</span>

                  {/* Live Minimalist Signal Waveform with Dynamic Vertical Heights */}
                  <div className={styles.signalContainer} aria-hidden="true">
                    <div className={styles.signalTrack}>
                      <svg
                        className={styles.signalSvg}
                        viewBox="0 0 480 36"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          className={styles.signalPath}
                          d={SIGNAL_PATHS[index % SIGNAL_PATHS.length]}
                        />
                      </svg>
                      <svg
                        className={styles.signalSvg}
                        viewBox="0 0 480 36"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          className={styles.signalPath}
                          d={SIGNAL_PATHS[index % SIGNAL_PATHS.length]}
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </a>
            </li>
          ))}
        </ul>

        {/* Minimalist Contact Section in Mobile Menu */}
        <div className={styles.drawerContact}>
          <span className={styles.drawerContactHeading}>Contact</span>
          <a
            href={`mailto:${siteContent.meta.email}`}
            className={styles.drawerContactItem}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
            <span>{siteContent.meta.email}</span>
          </a>
          <a
            href={`tel:${siteContent.meta.phone.replace(/\s+/g, "")}`}
            className={styles.drawerContactItem}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <span>{siteContent.meta.phone}</span>
          </a>
        </div>

        <div className={styles.mobileActions}>
          <button
            type="button"
            className="pillButton"
            onClick={() => {
              handleNavClick();
              if (onOpenContact) onOpenContact();
            }}
            aria-haspopup="dialog"
            style={{ width: "100%", justifyContent: "center" }}
          >
            <span>Let's talk</span>
            <span className="arrow" aria-hidden="true">
              →
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};

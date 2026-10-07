import React, { useState, useEffect } from "react";
import { Mail } from "lucide-react";
import { siteContent } from "../../content/siteContent";
import { ThemeToggle } from "../ThemeToggle/ThemeToggle";
import type { Theme } from "../../hooks/useTheme";
import { REAL_TECH_ITEMS } from "../TechMarquee/RealTechIcons";
import logoImg from "../../assets/logo/KE-LOGO-.png";
import styles from "./Navbar.module.css";

interface NavbarProps {
  theme: Theme;
  onToggleTheme: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  onOpenContact?: () => void;
}

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
      if (window.innerWidth >= 960 && mobileMenuOpen) {
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
      <div className={styles.inner}>
        {/* Brand Logo Zone */}
        <a
          href="#hero"
          className={styles.brand}
          aria-label={`${siteContent.meta.name} Portfolio Homepage`}
        >
          <img
            src={logoImg}
            alt="Kennu Elnar"
            className={styles.brandLogo}
            width={212}
            height={235}
            loading="eager"
          />
        </a>

        {/* Right Zone: Navigation Links positioned beside Dark Mode Toggle and Actions */}
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

          {/* Primary Actions: Theme Toggle, Mail Box Button, Hamburger */}
          <div className={styles.actions}>
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />

            {/* Mail Box Button (both Desktop & Mobile) */}
            <button
              type="button"
              className={styles.mailBoxButton}
              onClick={onOpenContact}
              aria-haspopup="dialog"
              aria-label="Message me"
              title="Message me"
            >
              <Mail className={styles.mailBoxIcon} aria-hidden="true" />
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

                  {/* Mini Moving & 3D Spinning Tech Language Icons Ribbon */}
                  <div
                    className={styles.navTechTrackContainer}
                    aria-hidden="true"
                  >
                    <div className={styles.navTechTrack}>
                      {/* Set 1 */}
                      <div className={styles.navTechGroup}>
                        {REAL_TECH_ITEMS.map((tech, idx) => (
                          <span
                            key={`m1-${tech.id}-${idx}`}
                            className={styles.navTechIcon}
                            style={{
                              animationDelay: `${(idx + index * 3) * 0.22}s`,
                            }}
                          >
                            {tech.icon}
                          </span>
                        ))}
                      </div>
                      {/* Set 2 for seamless infinite loop */}
                      <div className={styles.navTechGroup} aria-hidden="true">
                        {REAL_TECH_ITEMS.map((tech, idx) => (
                          <span
                            key={`m2-${tech.id}-${idx}`}
                            className={styles.navTechIcon}
                            style={{
                              animationDelay: `${(idx + index * 3) * 0.22}s`,
                            }}
                          >
                            {tech.icon}
                          </span>
                        ))}
                      </div>
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
            <span>Message me</span>
            <span className="arrow" aria-hidden="true">
              →
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};

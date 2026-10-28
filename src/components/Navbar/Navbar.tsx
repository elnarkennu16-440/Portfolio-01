import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
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
  onOpenSubpage?: (
    subpage: "experience" | "workflows" | "services" | "resume",
  ) => void;
  /**
   * Optional. When provided, the navbar reveal animation starts exactly when this
   * becomes true (end of the loader). When NOT provided, it falls back to a 3s timer.
   */
  isIntroDone?: boolean;
}

/**
 * Handcrafted Document Resume Icon matching user reference image (image_1b3e5eda.png)
 */
const ResumeDocIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Page base with top-right fold cut */}
    <path
      d="M2 3C2 1.89543 2.89543 1 4 1H15L22 8V25C22 26.1046 21.1046 27 20 27H4C2.89543 27 2 26.1046 2 25V3Z"
      fill="currentColor"
    />
    {/* Dog-ear fold */}
    <path
      d="M14.5 1V7C14.5 7.55228 14.9477 8 15.5 8H22"
      stroke="var(--bg-surface, #121214)"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Inner Avatar circle in top left */}
    <circle
      cx="8"
      cy="10.5"
      r="3.2"
      stroke="var(--bg-surface, #121214)"
      strokeWidth="1.2"
      fill="none"
    />
    <circle cx="8" cy="9.6" r="1.3" fill="var(--bg-surface, #121214)" />
    <path
      d="M5.8 12.6C6.1 11.5 7 11.1 8 11.1C9 11.1 9.9 11.5 10.2 12.6"
      stroke="var(--bg-surface, #121214)"
      strokeWidth="1.1"
      strokeLinecap="round"
    />
    {/* Top-right 3 lines */}
    <line
      x1="13.5"
      y1="7.5"
      x2="18.5"
      y2="7.5"
      stroke="var(--bg-surface, #121214)"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
    <line
      x1="13.5"
      y1="10.5"
      x2="18.5"
      y2="10.5"
      stroke="var(--bg-surface, #121214)"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
    <line
      x1="13.5"
      y1="13.5"
      x2="18.5"
      y2="13.5"
      stroke="var(--bg-surface, #121214)"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
    {/* 4 horizontal body bars */}
    <line
      x1="5.5"
      y1="16.5"
      x2="18.5"
      y2="16.5"
      stroke="var(--bg-surface, #121214)"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <line
      x1="5.5"
      y1="19.5"
      x2="18.5"
      y2="19.5"
      stroke="var(--bg-surface, #121214)"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <line
      x1="5.5"
      y1="22.5"
      x2="18.5"
      y2="22.5"
      stroke="var(--bg-surface, #121214)"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <line
      x1="5.5"
      y1="25"
      x2="18.5"
      y2="25"
      stroke="var(--bg-surface, #121214)"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

// Remembers that the reveal already played, so it does not replay if Navbar remounts.
let navRevealPlayed = false;

type NavRevealPhase = "pre" | "play" | "done";

/* =========================================================================
   LOADER -> NAVBAR LOGO FLIGHT (shared element transition)
   The loader fires LOGO_HANDOFF_EVENT with the logo's on-screen rect when it
   starts to exit. A fixed "flying" copy of the logo is created at exactly
   that spot, waits while the navbar pill appears, then glides slowly to the
   real navbar logo while the pill expands to the left. It fades out as the
   real logo fades in. The loader and navbar animations themselves are NOT
   changed.
   ========================================================================= */
const LOGO_HANDOFF_EVENT = "ke:intro-logo-handoff";

interface LogoHandoffRect {
  left: number;
  top: number;
  width: number;
  height: number;
  at?: number;
  /** true when the Navbar built the start rect itself (no loader event received) */
  synthetic?: boolean;
}

/** Wait after the navbar reveal starts before the logo begins to fly (ms). */
const FLIGHT_DELAY_MS = 400;
/** How long the flight takes (ms). Delay + duration = 2100ms = end of navReveal. */
const FLIGHT_DURATION_MS = 1700;
/** Cross-fade between the flying logo and the real navbar logo (ms). */
const FLIGHT_FADE_MS = 450;

/** Same size/position as the centered loader logo (mirrors IntroLoader.module.css). */
const computeCenterRect = (): LogoHandoffRect => {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let w: number;
  if (vw <= 480) w = Math.min(185, Math.max(140, vw * 0.5));
  else if (vw <= 768) w = Math.min(210, Math.max(150, vw * 0.46));
  else w = Math.min(270, Math.max(180, vw * 0.22));
  const h = (w * 235) / 212;
  return {
    left: (vw - w) / 2,
    top: (vh - h) / 2,
    width: w,
    height: h,
    synthetic: true,
  };
};

export const Navbar: React.FC<NavbarProps> = ({
  theme,
  onToggleTheme,
  onOpenContact,
  onOpenSubpage,
  isIntroDone,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopDropdownOpen, setDesktopDropdownOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("hero");

  // ---- Navbar reveal animation (starts after the loader) ----
  const [timerReady, setTimerReady] = useState(false);
  const [revealPhase, setRevealPhase] = useState<NavRevealPhase>(() => {
    if (navRevealPlayed) return "done";
    if (
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return "done";
    }
    return "pre";
  });

  useEffect(() => {
    if (isIntroDone !== undefined || revealPhase !== "pre") return;
    const t = setTimeout(() => setTimerReady(true), 3000);
    return () => clearTimeout(t);
  }, [isIntroDone, revealPhase]);

  const introReady = isIntroDone ?? timerReady;

  useEffect(() => {
    if (introReady) {
      setRevealPhase((p) => (p === "pre" ? "play" : p));
    }
  }, [introReady]);

  const revealClass =
    revealPhase === "pre"
      ? styles.navPre
      : revealPhase === "play"
        ? styles.navPlay
        : "";
  const dropdownCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // ---- Logo flight (loader -> navbar) ----
  const headerRef = useRef<HTMLElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const brandLogoRef = useRef<HTMLImageElement | null>(null);
  const flyerRef = useRef<HTMLDivElement | null>(null);
  const revealPhaseRef = useRef<NavRevealPhase>(revealPhase);
  const themeRef = useRef<Theme>(theme);
  revealPhaseRef.current = revealPhase;
  themeRef.current = theme;

  const flightStartedRef = useRef(false);
  const [flyRect, setFlyRect] = useState<LogoHandoffRect | null>(null);
  const [flyToneLight, setFlyToneLight] = useState(false);
  // true from the moment the reveal starts (stays true after it ends)
  const flightArmed = revealPhase !== "pre";

  // 1) Receive the loader logo position
  useEffect(() => {
    const accept = (rect: LogoHandoffRect) => {
      if (!rect || navRevealPlayed || revealPhaseRef.current === "done") return;
      if (flightStartedRef.current) return;
      flightStartedRef.current = true;
      setFlyRect(rect);
    };

    const onHandoff = (e: Event) => {
      accept((e as CustomEvent<LogoHandoffRect>).detail);
    };
    window.addEventListener(LOGO_HANDOFF_EVENT, onHandoff);

    // If the Navbar mounted a bit after the loader fired the event
    const stored = (
      window as unknown as { __keIntroLogoHandoff?: LogoHandoffRect }
    ).__keIntroLogoHandoff;
    if (stored && stored.at && Date.now() - stored.at < 6000) {
      accept(stored);
    }

    return () => window.removeEventListener(LOGO_HANDOFF_EVENT, onHandoff);
  }, []);

  // 1b) Fallback: if no loader event arrived (loader already unmounted / Navbar
  //     mounted late), start the flight from the centered loader-logo position.
  useEffect(() => {
    if (revealPhase !== "play" || flyRect || flightStartedRef.current) return;
    flightStartedRef.current = true;
    setFlyRect(computeCenterRect());
  }, [revealPhase, flyRect]);

  // 2) Safety net + cleanup of the stored handoff
  useEffect(() => {
    if (!flyRect) {
      setFlyToneLight(false);
      (
        window as unknown as { __keIntroLogoHandoff?: LogoHandoffRect }
      ).__keIntroLogoHandoff = undefined;
      return;
    }
    const t = setTimeout(() => setFlyRect(null), 10000);
    return () => clearTimeout(t);
  }, [flyRect]);

  // 3) Light theme: the flying logo smoothly turns dark (matches the navbar logo)
  useEffect(() => {
    if (!flyRect || themeRef.current !== "light") return;
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setFlyToneLight(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [flyRect]);

  // 4) The flight itself: slow, eased glide to the final navbar logo spot.
  //    Uses the Web Animations API (transform/opacity only) so it runs on the
  //    compositor and stays smooth even while the pill is animating its width.
  //    The target is measured ONCE (no per-frame layout reads).
  useEffect(() => {
    if (!flyRect || !flightArmed) return;
    const node = flyerRef.current;
    const brand = brandLogoRef.current;
    const inner = innerRef.current;
    const header = headerRef.current;
    if (!node || !brand || !inner || !header) {
      setFlyRect(null);
      return;
    }

    // Where the real navbar logo will sit once the pill finished expanding.
    // (The pill's right edge never moves; only its left edge expands.)
    const b = brand.getBoundingClientRect();
    const h = header.getBoundingClientRect();
    const hs = getComputedStyle(header);
    const is = getComputedStyle(inner);
    const padL = parseFloat(hs.paddingLeft) || 0;
    const padR = parseFloat(hs.paddingRight) || 0;
    const contentW = h.width - padL - padR;
    const maxW = parseFloat(is.maxWidth);
    const finalW = Number.isFinite(maxW) ? Math.min(contentW, maxW) : contentW;
    const targetLeft =
      h.left +
      padL +
      (contentW - finalW) / 2 +
      (parseFloat(is.borderLeftWidth) || 0) +
      (parseFloat(is.paddingLeft) || 0);
    const targetTop = b.top;
    const scale = b.width / flyRect.width;

    const EASE = "cubic-bezier(0.65, 0, 0.35, 1)"; // easeInOutCubic
    const flightEnd = FLIGHT_DELAY_MS + FLIGHT_DURATION_MS;
    const anims: Animation[] = [];

    if (flyRect.synthetic) {
      anims.push(
        node.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: 300,
          easing: "ease-out",
          fill: "both",
        }),
      );
    }

    anims.push(
      node.animate(
        [
          {
            transform: `translate3d(${flyRect.left}px, ${flyRect.top}px, 0) scale(1)`,
          },
          {
            transform: `translate3d(${targetLeft}px, ${targetTop}px, 0) scale(${scale})`,
          },
        ],
        {
          delay: FLIGHT_DELAY_MS,
          duration: FLIGHT_DURATION_MS,
          easing: EASE,
          fill: "both",
        },
      ),
    );

    // Landed: cross-fade into the real navbar logo, then remove the flyer
    const fadeOut = node.animate([{ opacity: 1 }, { opacity: 0 }], {
      delay: flightEnd,
      duration: FLIGHT_FADE_MS,
      easing: "ease-out",
      fill: "forwards",
    });
    fadeOut.onfinish = () => setFlyRect(null);
    anims.push(fadeOut);

    return () => {
      anims.forEach((a) => a.cancel());
    };
  }, [flyRect, flightArmed]);

  const handleDropdownMouseEnter = () => {
    if (dropdownCloseTimerRef.current) {
      clearTimeout(dropdownCloseTimerRef.current);
      dropdownCloseTimerRef.current = null;
    }
    setDesktopDropdownOpen(true);
  };

  const handleDropdownMouseLeave = () => {
    if (dropdownCloseTimerRef.current) {
      clearTimeout(dropdownCloseTimerRef.current);
    }
    dropdownCloseTimerRef.current = setTimeout(() => {
      setDesktopDropdownOpen(false);
    }, 200);
  };

  const handleCloseDropdownImmediately = () => {
    if (dropdownCloseTimerRef.current) {
      clearTimeout(dropdownCloseTimerRef.current);
      dropdownCloseTimerRef.current = null;
    }
    setDesktopDropdownOpen(false);
  };

  useEffect(() => {
    return () => {
      if (dropdownCloseTimerRef.current) {
        clearTimeout(dropdownCloseTimerRef.current);
      }
    };
  }, []);

  // Track active section via IntersectionObserver
  useEffect(() => {
    const sectionIds = [
      "hero",
      "about",
      "works",
      "capabilities",
      "professional-overview",
      "process",
    ];
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
      if (e.key === "Escape") {
        if (desktopDropdownOpen) {
          handleCloseDropdownImmediately();
        }
        if (mobileMenuOpen) {
          setMobileMenuOpen(false);
        }
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
  }, [mobileMenuOpen, desktopDropdownOpen]);

  const handleNavClick = () => {
    if (mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  };

  return (
    <>
      <header ref={headerRef} className={`${styles.header} ${revealClass}`}>
        <div
          ref={innerRef}
          className={styles.inner}
          // Limits layout work to the pill while it expands (no visual change)
          style={
            revealPhase === "play" ? { contain: "layout style" } : undefined
          }
          onAnimationEnd={(e) => {
            if (e.target === e.currentTarget && revealPhase === "play") {
              navRevealPlayed = true;
              setRevealPhase("done");
            }
          }}
        >
          {/* Brand Logo Zone */}
          <a
            href="#hero"
            className={styles.brand}
            aria-label={`${siteContent.meta.name} Portfolio Homepage`}
          >
            <img
              ref={brandLogoRef}
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
                  const hasDropdown = Boolean(
                    item.dropdown && item.dropdown.length > 0,
                  );

                  if (hasDropdown && item.dropdown) {
                    return (
                      <li key={item.id}>
                        <div
                          className={styles.dropdownTriggerWrap}
                          onMouseEnter={handleDropdownMouseEnter}
                          onMouseLeave={handleDropdownMouseLeave}
                          onFocus={handleDropdownMouseEnter}
                          onBlur={(e) => {
                            if (
                              !e.currentTarget.contains(e.relatedTarget as Node)
                            ) {
                              handleDropdownMouseLeave();
                            }
                          }}
                        >
                          <a
                            href={item.href}
                            className={`${styles.navLink} ${styles.navLinkWithDropdown} ${
                              isActive ? styles.navLinkActive : ""
                            }`}
                            aria-current={isActive ? "page" : undefined}
                            aria-haspopup="menu"
                            aria-expanded={desktopDropdownOpen}
                            onClick={handleCloseDropdownImmediately}
                          >
                            <span>{item.label}</span>
                            <svg
                              width="11"
                              height="11"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className={`${styles.chevronIcon} ${
                                desktopDropdownOpen
                                  ? styles.chevronIconOpen
                                  : ""
                              }`}
                              aria-hidden="true"
                            >
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          </a>

                          {/* Minimalist Dark Gray Dropdown Menu */}
                          <div
                            className={`${styles.dropdownMenu} ${
                              desktopDropdownOpen ? styles.dropdownMenuOpen : ""
                            }`}
                            role="menu"
                            aria-label={`${item.label} subpages`}
                          >
                            <div className={styles.dropdownHeader}>
                              <span className={styles.dropdownHeaderMono}>
                                PROFESSIONAL OVERVIEW
                              </span>
                            </div>

                            <div className={styles.dropdownItemsList}>
                              {item.dropdown.map((subItem) => {
                                if (subItem.subpage) {
                                  return (
                                    <button
                                      key={subItem.id}
                                      type="button"
                                      className={styles.dropdownItemBtn}
                                      onClick={() => {
                                        handleCloseDropdownImmediately();
                                        if (onOpenSubpage && subItem.subpage) {
                                          onOpenSubpage(subItem.subpage);
                                        }
                                      }}
                                      role="menuitem"
                                    >
                                      <div
                                        className={styles.dropdownItemContent}
                                      >
                                        <span
                                          className={styles.dropdownItemLabel}
                                        >
                                          {subItem.label}
                                        </span>
                                        {subItem.description && (
                                          <span
                                            className={styles.dropdownItemDesc}
                                          >
                                            {subItem.description}
                                          </span>
                                        )}
                                      </div>
                                      <span
                                        className={styles.dropdownItemArrow}
                                        aria-hidden="true"
                                      >
                                        ↗
                                      </span>
                                    </button>
                                  );
                                }
                                return (
                                  <a
                                    key={subItem.id}
                                    href={subItem.href || item.href}
                                    className={styles.dropdownItemLink}
                                    onClick={() =>
                                      setDesktopDropdownOpen(false)
                                    }
                                    role="menuitem"
                                  >
                                    <div className={styles.dropdownItemContent}>
                                      <span
                                        className={styles.dropdownItemLabel}
                                      >
                                        {subItem.label}
                                      </span>
                                      {subItem.description && (
                                        <span
                                          className={styles.dropdownItemDesc}
                                        >
                                          {subItem.description}
                                        </span>
                                      )}
                                    </div>
                                    <span
                                      className={styles.dropdownItemArrow}
                                      aria-hidden="true"
                                    >
                                      ↓
                                    </span>
                                  </a>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  }

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

            {/* Primary Actions: Resume Box Button, Theme Toggle, Mail Box Button, Hamburger */}
            <div className={styles.actions}>
              {/* Square Resume / Curriculum Vitae Box Button (matching image_ea06234b.png & image_1b3e5eda.png) */}
              <button
                type="button"
                className={styles.resumeBoxButton}
                onClick={() =>
                  onOpenSubpage ? onOpenSubpage("resume") : undefined
                }
                aria-label="View Resume / Curriculum Vitae"
                title="Resume"
              >
                <ResumeDocIcon className={styles.resumeBoxIcon} />
              </button>

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
            {siteContent.navigation.map((item, index) => {
              const hasDropdown = Boolean(
                item.dropdown && item.dropdown.length > 0,
              );

              return (
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
                          <div
                            className={styles.navTechGroup}
                            aria-hidden="true"
                          >
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

                  {/* Subpage Links for Dropdown Items in Mobile Menu */}
                  {hasDropdown && item.dropdown && (
                    <ul className={styles.mobileSubList}>
                      {item.dropdown.map((subItem) => (
                        <li key={subItem.id} className={styles.mobileSubItem}>
                          {subItem.subpage ? (
                            <button
                              type="button"
                              className={styles.mobileSubBtn}
                              onClick={() => {
                                setMobileMenuOpen(false);
                                if (onOpenSubpage && subItem.subpage) {
                                  onOpenSubpage(subItem.subpage);
                                }
                              }}
                            >
                              <span>{subItem.label}</span>
                              <span
                                className={styles.mobileSubArrow}
                                aria-hidden="true"
                              >
                                ↗
                              </span>
                            </button>
                          ) : (
                            <a
                              href={subItem.href || item.href}
                              className={styles.mobileSubLink}
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              <span>{subItem.label}</span>
                              <span
                                className={styles.mobileSubArrow}
                                aria-hidden="true"
                              >
                                ↓
                              </span>
                            </a>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
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
            {/* Resume: text + underline only (same style as Experience / Workflows / Services, no arrow) */}
            <button
              type="button"
              className={`${styles.mobileSubBtn} ${styles.mobileResumeBtn}`}
              onClick={() => {
                handleNavClick();
                if (onOpenSubpage) onOpenSubpage("resume");
              }}
            >
              <span>Resume</span>
            </button>
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

      {/* Flying logo: starts exactly on top of the loader logo, then glides into the navbar */}
      {flyRect &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={flyerRef}
            className={styles.flyLogo}
            aria-hidden="true"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              zIndex: 2147483000,
              pointerEvents: "none",
              transformOrigin: "0 0",
              willChange: "transform, opacity",
              width: flyRect.width,
              height: flyRect.height,
              transform: `translate3d(${flyRect.left}px, ${flyRect.top}px, 0)`,
            }}
          >
            <div
              className={`${styles.flyLogoTone} ${
                flyToneLight ? styles.flyLogoToneLight : ""
              }`}
              style={{
                width: "100%",
                height: "100%",
                position: "relative",
                transition: "filter 0.65s ease",
                filter: flyToneLight ? "invert(1)" : "none",
              }}
            >
              <img
                src={logoImg}
                alt=""
                className={styles.flyLogoImg}
                draggable={false}
                style={{
                  position: "relative",
                  display: "block",
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  // no glow: overrides any drop-shadow from the optional CSS block
                  filter: "none",
                }}
              />
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};

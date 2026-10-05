# Kennu Elnar — Personal Portfolio

A distinctive, high-craft personal portfolio website for **Kennu Elnar**, an aspiring **Web Developer & QA Tester**. Designed with an editorial, gallery-grade photobook aesthetic, strict grayscale design tokens, responsive typography, and an unwavering commitment to accessibility and performance.

---

## Highlights & Front-End Craftsmanship

* **Strict Design System:** 100% grayscale palette using custom CSS variables (no accent hue, warm off-whites, crisp dark tones, and hairline rules). Zero Tailwind, zero inline styles.
* **Editorial Layouts:** Asymmetric 12-column grid, oversized photobook numerals, flowing hairline SVG curves, faint margin watermarks, and overlapping project label panels.
* **Zero-Pill Discipline:** Metadata tags (categories, years, tech stacks) are rendered as clean, unboxed typography separated by subtle `·` glyphs instead of rounded pill boxes.
* **Compositor-Only Motion:** Smooth intro sequence and `IntersectionObserver` scroll reveals that animate **only** `transform`, `opacity`, and `clip-path` (no layout thrashing, no `backdrop-filter`).
* **Complete Accessibility:** 
  - Validated keyboard navigation with skip-to-content anchor.
  - Custom focus trap modal with `Escape` dismiss and trigger focus restoration.
  - High-visibility focus indicators (`:focus-visible`).
  - Strict `@media (prefers-reduced-motion: reduce)` overrides for all motion effects.
  - Screen-reader friendly semantic markup and WCAG AA contrast.
* **Single Source of Truth:** All copy, project descriptions, skills, and links reside in `src/content/siteContent.ts`.

---

## Tech Stack

* **Framework:** React 19 + TypeScript (strict mode, zero `any`)
* **Build Tool:** Vite
* **Styling:** CSS Modules + Global CSS Custom Properties (`tokens.css` & `global.css`)
* **Icons:** Lucide React

---

## Quick Start (Local Development)

### 1. Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher recommended)
* `npm` or `pnpm`

### 2. Installation
Clone or extract the repository, then install dependencies:
```bash
npm install
```

### 3. Development Server
Start the local development server:
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

### 4. Verification & Type Checking
Run the strict TypeScript type check and linter:
```bash
npm run typecheck
npm run lint
```

### 5. Production Build & Preview
To create an optimized production build:
```bash
npm run build
npm run preview
```

---

## Customization Guide

### 1. Updating Your Formal Portrait
Place your high-resolution portrait photograph into:
```
public/images/profile/kennu-portrait.jpg
```
The application will automatically display it within the architectural matte frame (`PLATE / 01`) with grayscale styling and eager loading.

### 2. Adding Your PDF Resume
Drop your updated resume PDF into:
```
public/resume/Kennu-Elnar-Resume.pdf
```
Both the Hero "Download resume" button and the Footer link will immediately download this file.

### 3. Editing Bio, Projects, and Skills
Open `src/content/siteContent.ts`. All data is strongly typed:
* `about`: Edit your biography, journey, and the 3 core pillars.
* `works`: Update the 4 project titles, descriptions, live demo URLs, repository links, and tech tags.
* `capabilities`: Add or refine skills under Front-end, QA & Testing, and Tools.
* `process`: Customize the 4 steps of your engineering and QA methodology.

### 4. Contact Form Configuration
The Contact Modal supports two modes:
1. **Direct Mailto Fallback (Default):** If no endpoint is set, submitting the form transparently opens your default email client with a pre-filled subject and message draft addressed to `elnarkennu16@gmail.com`.
2. **Custom API Endpoint:** Set your backend endpoint in `.env`:
   ```bash
   VITE_CONTACT_ENDPOINT=https://your-api-endpoint.com/api/contact
   ```

---

## Content TODO Checklist

The UI renders natural, clean copy without any visible `[PLACEHOLDER]` tags. To inspect blocks still marked `status: "placeholder"` in local development, open:
`http://localhost:3000/?debug=content`

Checklist of content blocks in `src/content/siteContent.ts`:
- [ ] **Location (`meta.location`):** Currently empty and hidden. Add your city (e.g., "Manila, Philippines") when ready.
- [ ] **Social Profiles (`meta.githubUrl`, `meta.linkedinUrl`):** Currently empty and hidden. Add your GitHub/LinkedIn URLs.
- [ ] **Hero Manifesto (`hero.manifesto`):** Currently set to junior QA & web developer summary. Review or refine.
- [ ] **About Narrative (`about.paragraphs`):** Contains honest junior bio. Replace with your own 2-4 sentences when ready.
- [ ] **Projects (`works.projects`):** Contains 2 initial project slots. Update with real GitHub repository URLs, live links, and screenshot captures.

---

## Directory Structure

```
├── public/
│   ├── images/profile/kennu-portrait.jpg   # Portrait asset
│   ├── resume/Kennu-Elnar-Resume.pdf       # Resume download
│   └── favicon.svg                         # Monogram favicon
├── src/
│   ├── components/
│   │   ├── ContactModal/                   # Accessible dialog with focus trap
│   │   ├── Navbar/                         # Navigation bar with mobile drawer
│   │   └── ThemeToggle/                    # View Transitions theme switcher
│   ├── content/
│   │   └── siteContent.ts                  # Single source of truth for all content
│   ├── hooks/
│   │   ├── useFocusTrap.ts                 # Accessible keyboard trap hook
│   │   ├── useScrollReveal.ts              # IntersectionObserver reveal hook
│   │   └── useTheme.ts                     # Dark/light theme state manager
│   ├── sections/
│   │   ├── Hero/                           # Asymmetric headline & framed portrait
│   │   ├── About/                          # Editorial narrative & 3 core pillars
│   │   ├── Works/                          # 4 project slots with overlapping panels
│   │   ├── Capabilities/                   # 3-column skills index table
│   │   ├── Process/                        # 4-step QA workflow
│   │   └── Footer/                         # Minimalist footer with resume & triggers
│   ├── styles/
│   │   ├── tokens.css                      # Grayscale color, typography & spacing tokens
│   │   └── global.css                      # Global resets, base styles, utilities
│   ├── App.tsx                             # Main page orchestrator
│   └── main.tsx                            # React root entry
├── .env.example
├── metadata.json
├── package.json
└── tsconfig.json
```

---

## License
Created for Kennu Elnar. All rights reserved.

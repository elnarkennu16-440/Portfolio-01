import React from "react";
import styles from "./Capabilities.module.css";

/**
 * 3D CAPABILITY ICONS
 * ---------------------------------------------------------------------------
 * Hand-built isometric icons (pure SVG — no images, no libraries, no extra requests).
 * Every icon is a grey 3D slab with a raised, extruded emblem that matches the tool.
 * Colours come from CSS variables in Capabilities.module.css, so they follow your
 * dark / light theme automatically.
 *
 * Icons are matched to each capability by its NAME (see ICON_RULES). A new item that
 * does not match any rule gets the neutral "chip" icon, so nothing ever breaks.
 * --------------------------------------------------------------------------- */

export type CapabilityIconKey =
  | "html"
  | "js"
  | "ts"
  | "react"
  | "vue"
  | "manual"
  | "testcase"
  | "bug"
  | "playwright"
  | "api"
  | "git"
  | "editor"
  | "devtools"
  | "node"
  | "vite"
  | "board"
  | "responsive"
  | "a11y"
  | "refresh"
  | "package"
  | "database"
  | "gauge"
  | "cloud"
  | "wireframe"
  | "chip";

interface GlyphPath {
  d: string;
  fill?: boolean;
}

interface GlyphDef {
  sw: number; // stroke width of the emblem
  paths: GlyphPath[];
}

// Emblems are drawn in a flat ±18 box, then projected onto the slab's top face.
const GLYPHS: Record<CapabilityIconKey, GlyphDef> = {
  html: {
    sw: 3.4,
    paths: [
      { d: "M-8 -9 L-17 0 L-8 9" },
      { d: "M8 -9 L17 0 L8 9" },
      { d: "M3 -14 L-3 14" },
    ],
  },
  js: {
    sw: 3.2,
    paths: [
      { d: "M-4 -12 V3 Q-4 11 -10.5 11 Q-16.5 11 -16.5 5" },
      {
        d: "M16 -8 Q13 -12 8.5 -12 Q2.5 -12 2.5 -6.5 Q2.5 -2.5 9 0 Q16 3 16 7 Q16 12 9 12 Q3.5 12 1.5 8",
      },
    ],
  },
  ts: {
    sw: 3.2,
    paths: [
      { d: "M-17 -11 H-3 M-10 -11 V11" },
      {
        d: "M16 -8 Q13 -12 8.5 -12 Q2.5 -12 2.5 -6.5 Q2.5 -2.5 9 0 Q16 3 16 7 Q16 12 9 12 Q3.5 12 1.5 8",
      },
    ],
  },
  react: {
    sw: 2.2,
    paths: [
      { d: "M-17.0 0.0 A17 6.6 0 1 0 17.0 0.0 A17 6.6 0 1 0 -17.0 0.0" },
      { d: "M-8.5 -14.72 A17 6.6 60 1 0 8.5 14.72 A17 6.6 60 1 0 -8.5 -14.72" },
      {
        d: "M8.5 -14.72 A17 6.6 120 1 0 -8.5 14.72 A17 6.6 120 1 0 8.5 -14.72",
      },
      { d: "M-2.8 0 A2.8 2.8 0 1 0 2.8 0 A2.8 2.8 0 1 0 -2.8 0", fill: true },
    ],
  },
  vue: {
    sw: 3.4,
    paths: [{ d: "M-17 -12 L0 15 L17 -12" }, { d: "M-8.5 -12 L0 3 L8.5 -12" }],
  },
  manual: {
    sw: 3.0,
    paths: [
      { d: "M-9 -14 L-9 9 L-3.5 4.5 L0 13 L4.5 11 L1 3 L8 3 Z" },
      { d: "M6 -12 Q13 -9 14 -2" },
    ],
  },
  testcase: {
    sw: 2.6,
    paths: [
      { d: "M-12 -10 H12 V15 H-12 Z" },
      { d: "M-5 -14 H5 V-8 H-5 Z" },
      { d: "M-7.5 -1 L-4.5 2 L0 -4" },
      { d: "M-7.5 8 L-4.5 11 L0 5" },
      { d: "M4 -1 H8.5" },
      { d: "M4 8 H8.5" },
    ],
  },
  bug: {
    sw: 2.8,
    paths: [
      { d: "M-7.0 3.0 A7 9 0 1 0 7.0 3.0 A7 9 0 1 0 -7.0 3.0" },
      { d: "M-3.6 -9.5 A3.6 3.6 0 1 0 3.6 -9.5 A3.6 3.6 0 1 0 -3.6 -9.5" },
      {
        d: "M-7 -1 H-15 M-7 5 H-15 M-7 10 L-13 15 M7 -1 H15 M7 5 H15 M7 10 L13 15",
      },
      { d: "M-3 -13 L-6 -17 M3 -13 L6 -17" },
      { d: "M0 -6 V12" },
    ],
  },
  playwright: {
    sw: 2.8,
    paths: [
      { d: "M-16 -13 H16 V14 H-16 Z" },
      { d: "M-16 -6 H16" },
      {
        d: "M-13.1 -9.5 A1.1 1.1 0 1 0 -10.9 -9.5 A1.1 1.1 0 1 0 -13.1 -9.5",
        fill: true,
      },
      {
        d: "M-9.1 -9.5 A1.1 1.1 0 1 0 -6.9 -9.5 A1.1 1.1 0 1 0 -9.1 -9.5",
        fill: true,
      },
      { d: "M-8 4 L-2.5 9.5 L8.5 -1.5" },
    ],
  },
  api: {
    sw: 2.8,
    paths: [
      {
        d: "M-6 -14 Q-12 -14 -12 -8 V-3 Q-12 0 -16 0 Q-12 0 -12 3 V8 Q-12 14 -6 14",
      },
      { d: "M6 -14 Q12 -14 12 -8 V-3 Q12 0 16 0 Q12 0 12 3 V8 Q12 14 6 14" },
      { d: "M-4 -3 H4 M1 -6 L4 -3 L1 0 M4 4 H-4 M-1 1 L-4 4 L-1 7" },
    ],
  },
  git: {
    sw: 3.0,
    paths: [
      { d: "M-11.4 -11 A3.4 3.4 0 1 0 -4.6 -11 A3.4 3.4 0 1 0 -11.4 -11" },
      { d: "M-11.4 11 A3.4 3.4 0 1 0 -4.6 11 A3.4 3.4 0 1 0 -11.4 11" },
      { d: "M5.6 -3 A3.4 3.4 0 1 0 12.4 -3 A3.4 3.4 0 1 0 5.6 -3" },
      { d: "M-8 -7.6 V7.6" },
      { d: "M9 0.4 Q9 6.5 -1 7.4 Q-6 7.9 -8 8" },
    ],
  },
  editor: {
    sw: 2.8,
    paths: [
      { d: "M-16 -13 H16 V13 H-16 Z" },
      { d: "M-9 -13 V13" },
      { d: "M-4 -6 H9" },
      { d: "M-4 0 H4" },
      { d: "M-4 6 H10" },
    ],
  },
  devtools: {
    sw: 3.0,
    paths: [
      { d: "M-12.5 -3 A9.5 9.5 0 1 0 6.5 -3 A9.5 9.5 0 1 0 -12.5 -3" },
      { d: "M4 4 L14 14" },
      { d: "M-6 -6 L-8.5 -3 L-6 0" },
      { d: "M0 -6 L2.5 -3 L0 0" },
    ],
  },
  node: {
    sw: 3.0,
    paths: [
      { d: "M0 -15 L13 -7.5 V7.5 L0 15 L-13 7.5 V-7.5 Z" },
      { d: "M-4.5 5 V-5 L4.5 5 V-5" },
    ],
  },
  vite: { sw: 3.0, paths: [{ d: "M6 -16 L-9 3 H-1 L-5 16 L10 -3 H2 Z" }] },
  board: {
    sw: 2.8,
    paths: [
      { d: "M-15 -13 H15 V13 H-15 Z" },
      { d: "M-5 -13 V13" },
      { d: "M5 -13 V13" },
      { d: "M-11 -7 H-9" },
      { d: "M-11 0 H-9" },
      { d: "M-1 -7 H1" },
      { d: "M9 -7 H11" },
      { d: "M9 0 H11" },
    ],
  },
  responsive: {
    sw: 2.8,
    paths: [
      { d: "M-16 -12 H4 V4 H-16 Z" },
      { d: "M-9 11 H-3 M-6 4 V11" },
      { d: "M9 -4 H17 V13 H9 Z" },
    ],
  },
  a11y: {
    sw: 2.8,
    paths: [
      { d: "M-15 0 A15 15 0 1 0 15 0 A15 15 0 1 0 -15 0" },
      {
        d: "M-2.4 -6.5 A2.4 2.4 0 1 0 2.4 -6.5 A2.4 2.4 0 1 0 -2.4 -6.5",
        fill: true,
      },
      { d: "M-7 -1 H7 M0 -1 V6 M0 6 L-4.5 12 M0 6 L4.5 12" },
    ],
  },
  refresh: {
    sw: 3.0,
    paths: [
      { d: "M8.4 -10 A13 13 0 1 0 12.9 1.6" },
      { d: "M6 -17 L8.4 -10 L15 -12" },
    ],
  },
  package: {
    sw: 2.8,
    paths: [
      { d: "M0 -15 L13 -7.5 V7.5 L0 15 L-13 7.5 V-7.5 Z" },
      { d: "M-13 -7.5 L0 0 L13 -7.5" },
      { d: "M0 0 V15" },
    ],
  },
  database: {
    sw: 2.8,
    paths: [
      { d: "M-12.0 -9.0 A12 4.2 0 1 0 12.0 -9.0 A12 4.2 0 1 0 -12.0 -9.0" },
      { d: "M-12 -9 V9 Q-12 13.2 0 13.2 Q12 13.2 12 9 V-9" },
      { d: "M-12 0 Q-12 4.2 0 4.2 Q12 4.2 12 0" },
    ],
  },
  gauge: {
    sw: 3.0,
    paths: [
      { d: "M-15 9 A15 15 0 0 1 15 9" },
      { d: "M0 9 L7 -4" },
      { d: "M-2.6 9 A2.6 2.6 0 1 0 2.6 9 A2.6 2.6 0 1 0 -2.6 9", fill: true },
      { d: "M-15 9 H15" },
    ],
  },
  cloud: {
    sw: 3.0,
    paths: [
      {
        d: "M-10 9 H8 Q15 9 15 3 Q15 -3 9 -3 Q8 -11 0 -11 Q-8 -11 -9 -4 Q-15 -3 -15 3 Q-15 9 -10 9 Z",
      },
    ],
  },
  wireframe: {
    sw: 2.8,
    paths: [
      { d: "M-14 -12 H14 V12 H-14 Z" },
      { d: "M-14 -4 H14" },
      { d: "M-4 -4 V12" },
    ],
  },
  chip: {
    sw: 2.8,
    paths: [
      { d: "M-9 -9 H9 V9 H-9 Z" },
      { d: "M-4 -4 H4 V4 H-4 Z" },
      {
        d: "M-4 -9 V-14 M4 -9 V-14 M-4 9 V14 M4 9 V14 M-9 -4 H-14 M-9 4 H-14 M9 -4 H14 M9 4 H14",
      },
    ],
  },
};

// First match wins (order matters: more specific rules come first).
const ICON_RULES: Array<[RegExp, CapabilityIconKey]> = [
  [/typescript|\bts\b/, "ts"],
  [/\bvue/, "vue"],
  [/\bnode/, "node"],
  [/react|tailwind|next\.?js|\bjsx\b/, "react"],
  [/javascript|\bjs\b|es6|ecmascript/, "js"],
  [/html|css|sass|scss|semantic|markup/, "html"],
  [/playwright|selenium|cypress|e2e|end-to-end|automat/, "playwright"],
  [/\bapis?\b|postman|graphql|\brest\b|endpoint/, "api"],
  [
    /test case|test plan|test scenario|case design|unit test|jest|vitest/,
    "testcase",
  ],
  [/manual|exploratory|\buat\b|acceptance|\bqa\b/, "manual"],
  [/\bbugs?\b|defect|triage|issue/, "bug"],
  [/regression|ci\/cd|\bci\b|pipeline|github actions|workflow/, "refresh"],
  [/\bgit\b|github|gitlab|version control/, "git"],
  [/devtools|dev tools|chrome|inspect|debug/, "devtools"],
  [/vs ?code|vscode|cursor|\bide\b|editor|copilot/, "editor"],
  [/npm|yarn|pnpm|package/, "package"],
  [/vite|webpack|tooling|bundl|build|babel/, "vite"],
  [/responsive|mobile|cross-browser|device/, "responsive"],
  [/accessib|a11y|wcag|aria/, "a11y"],
  [/sql|database|mongo|supabase|firebase|postgres|\bdb\b/, "database"],
  [/lighthouse|performance|speed|optimi[sz]/, "gauge"],
  [/deploy|vercel|netlify|hosting|cloud|\baws\b|docker|heroku/, "cloud"],
  [/figma|\bui\b|\bux\b|wireframe|prototype|design/, "wireframe"],
  [/jira|trello|agile|scrum|kanban|board|project|notion/, "board"],
];

export const resolveCapabilityIcon = (name: string): CapabilityIconKey => {
  const n = name.toLowerCase();
  for (const [rule, key] of ICON_RULES) {
    if (rule.test(n)) return key;
  }
  return "chip";
};

const EXTRUDE_LAYERS = 5; // thickness of the raised emblem
const GLYPH_SCALE = 1.1;
// isometric projection of the emblem onto the slab's top face
const GLYPH_TRANSFORM = `translate(48 52) matrix(0.866 0.5 -0.866 0.5 0 0) scale(${GLYPH_SCALE})`;

const GlyphLayer: React.FC<{
  def: GlyphDef;
  offset: number;
  className: string;
}> = ({ def, offset, className }) => (
  <g transform={`translate(0 ${-offset})`} className={className}>
    <g
      transform={GLYPH_TRANSFORM}
      strokeWidth={def.sw + 0.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {def.paths.map((p, i) => (
        <path
          key={i}
          d={p.d}
          fill={p.fill ? "currentColor" : "none"}
          stroke={p.fill ? "none" : "currentColor"}
        />
      ))}
    </g>
  </g>
);

/**
 * Shared gradients for every icon. Render this ONCE inside the Capabilities section
 * (it is invisible and takes no space).
 */
export const CapabilityIconDefs: React.FC = () => (
  <svg
    className={styles.isoDefs}
    width="0"
    height="0"
    aria-hidden="true"
    focusable="false"
  >
    <defs>
      <linearGradient id="capIsoTop" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" style={{ stopColor: "var(--cap3d-top-a)" }} />
        <stop offset="1" style={{ stopColor: "var(--cap3d-top-b)" }} />
      </linearGradient>
      <linearGradient id="capIsoLeft" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" style={{ stopColor: "var(--cap3d-left-a)" }} />
        <stop offset="1" style={{ stopColor: "var(--cap3d-left-b)" }} />
      </linearGradient>
      <linearGradient id="capIsoRight" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" style={{ stopColor: "var(--cap3d-right-a)" }} />
        <stop offset="1" style={{ stopColor: "var(--cap3d-right-b)" }} />
      </linearGradient>
    </defs>
  </svg>
);

export const CapabilityIcon: React.FC<{ name: string }> = ({ name }) => {
  const def = GLYPHS[resolveCapabilityIcon(name)];
  const layers = Array.from({ length: EXTRUDE_LAYERS }, (_, i) => i);

  return (
    <svg
      className={styles.iconSvg}
      viewBox="0 16 96 76"
      aria-hidden="true"
      focusable="false"
    >
      {/* slab: left face, right face, top face */}
      <polygon
        points="6,52 48,74 48,86 6,64"
        fill="url(#capIsoLeft)"
        stroke="url(#capIsoLeft)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <polygon
        points="48,74 90,52 90,64 48,86"
        fill="url(#capIsoRight)"
        stroke="url(#capIsoRight)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <polygon
        points="48,30 90,52 48,74 6,52"
        fill="url(#capIsoTop)"
        stroke="url(#capIsoTop)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* soft rim light on the top edges */}
      <polyline
        points="6,52 48,30 90,52"
        fill="none"
        strokeWidth="1.2"
        strokeLinejoin="round"
        className={styles.isoRim}
      />
      <line
        x1="48"
        y1="74"
        x2="48"
        y2="86"
        strokeWidth="1"
        className={styles.isoRimSoft}
      />

      {/* raised emblem: stacked layers = real thickness, top layer = lit surface */}
      {layers.map((i) => (
        <GlyphLayer
          key={i}
          def={def}
          offset={i}
          className={styles.isoGlyphSide}
        />
      ))}
      <GlyphLayer
        def={def}
        offset={EXTRUDE_LAYERS}
        className={styles.isoGlyphTop}
      />
    </svg>
  );
};

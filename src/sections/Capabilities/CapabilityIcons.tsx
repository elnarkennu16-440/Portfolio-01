import React from "react";
import styles from "./Capabilities.module.css";
import { BRAND_ICONS } from "./brandIconData";

/**
 * 3D CAPABILITY ICONS
 * ---------------------------------------------------------------------------
 * Same isometric grey slab as before (pure SVG), but the raised emblem is now
 * the REAL logo of each tool / platform / technology.
 *
 * - Logo paths live in ./brandIconData.ts (key -> real brand path + brand colour).
 * - Default look is fully GREY (minimalist). On hover the logo zooms in and its real
 *   brand colour fades in. "mono" logos (Next.js, Vercel, GitHub ...) reveal a bright/dark
 *   theme colour instead, so they stay visible in dark AND light mode.
 * - Colours of the slab come from CSS variables in Capabilities.module.css.
 * --------------------------------------------------------------------------- */

export type CapabilityIconKey = keyof typeof BRAND_ICONS;

const EXTRUDE_LAYERS = 2; // side layers of the raised logo (fewer = faster scrolling)
const EXTRUDE_STEP = 2; // vertical distance between layers (total thickness = 4)
const GLYPH_SIDE = 33; // logo size (before projection) on the slab's top face
const FLOAT_SIDE = 34; // size of the flat logo that floats up on hover

// isometric projection of the logo onto the slab's top face
const projection = (vb: number) =>
  `translate(48 52) matrix(0.866 0.5 -0.866 0.5 0 0) scale(${GLYPH_SIDE / vb}) translate(${-vb / 2} ${-vb / 2})`;

/**
 * One layer of the raised logo. Colours come from CSS (grey by default,
 * brand colour on hover) — see .glyphTop / .glyphSide in the CSS module.
 */
const GlyphLayer: React.FC<{
  iconKey: CapabilityIconKey;
  offset: number;
  top: boolean;
}> = ({ iconKey, offset, top }) => {
  const def = BRAND_ICONS[iconKey];
  if (!def) return null;

  return (
    <g transform={`translate(0 ${-offset})`}>
      <g transform={projection(def.vb)}>
        {def.paths.map((d, i) => (
          <path
            key={i}
            d={d}
            className={top ? styles.glyphTop : styles.glyphSide}
            fillRule={def.evenodd ? "evenodd" : "nonzero"}
            clipRule={def.evenodd ? "evenodd" : "nonzero"}
          />
        ))}
      </g>
    </g>
  );
};

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

const CapabilityIconBase: React.FC<{ iconKey: CapabilityIconKey }> = ({
  iconKey,
}) => {
  const def = BRAND_ICONS[iconKey];
  if (!def) return null;
  const layers = Array.from({ length: EXTRUDE_LAYERS }, (_, i) => i);

  return (
    <svg
      className={styles.iconSvg}
      viewBox="0 16 96 76"
      aria-hidden="true"
      focusable="false"
      // brand colour is only revealed on hover (see CSS)
      style={
        {
          "--brand": def.mono ? "var(--cap3d-mono-hover)" : def.color,
        } as React.CSSProperties
      }
    >
      {/* cheap soft shadow: two flat shapes under the slab (no CSS filter) */}
      <polygon
        points="6,60 48,38 90,60 90,72 48,94 6,72"
        className={styles.isoShadow2}
      />
      <polygon
        points="6,56 48,34 90,56 90,68 48,90 6,68"
        className={styles.isoShadow}
      />

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

      {/* raised real logo: stacked layers = thickness, top layer = lit surface */}
      {layers.map((i) => (
        <GlyphLayer
          key={i}
          iconKey={iconKey}
          offset={i * EXTRUDE_STEP}
          top={false}
        />
      ))}
      <GlyphLayer
        iconKey={iconKey}
        offset={EXTRUDE_LAYERS * EXTRUDE_STEP}
        top
      />

      {/* hover: ONLY the logo (no slab) lifts off and floats in its brand colour */}
      <g transform="translate(48 31)" aria-hidden="true">
        <g className={styles.floatLogo}>
          <g className={styles.floatBob}>
            <g
              transform={`scale(${FLOAT_SIDE / def.vb}) translate(${-def.vb / 2} ${-def.vb / 2})`}
            >
              {def.paths.map((d, i) => (
                <path
                  key={i}
                  d={d}
                  className={styles.floatPath}
                  fillRule={def.evenodd ? "evenodd" : "nonzero"}
                  clipRule={def.evenodd ? "evenodd" : "nonzero"}
                />
              ))}
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
};

export const CapabilityIcon = React.memo(CapabilityIconBase);

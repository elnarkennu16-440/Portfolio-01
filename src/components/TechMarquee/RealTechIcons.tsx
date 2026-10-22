import React from "react";
import { siteContent } from "../../content/siteContent";
import { BRAND_ICONS } from "../../sections/Capabilities/brandIconData";

export interface RealTechItem {
  id: string;
  name: string;
  icon: React.ReactElement;
}

/**
 * The marquee uses the SAME real brand logos as the Capabilities section
 * (single source of truth: siteContent.capabilities + brandIconData.ts).
 * Add / remove a tool in siteContent and it updates here automatically.
 *
 * Icons are drawn with fill="currentColor": gray by default (marquee CSS), and on
 * hover they reveal their real brand colour via the --brand CSS variable.
 */
const buildItems = (): RealTechItem[] => {
  const seenLogos = new Set<string>(); // skip duplicate logos (e.g. React Native = React)
  const items: RealTechItem[] = [];

  siteContent.capabilities.groups.forEach((group) => {
    group.items.forEach((item) => {
      const def = BRAND_ICONS[item.icon];
      if (!def) return;

      const signature = def.paths.join("|");
      if (seenLogos.has(signature)) return;
      seenLogos.add(signature);

      items.push({
        id: item.icon,
        name: item.name,
        icon: (
          <svg
            viewBox={`0 0 ${def.vb} ${def.vb}`}
            width="100%"
            height="100%"
            fill="currentColor"
            aria-hidden="true"
            focusable="false"
            // real brand colour, revealed only on hover (see TechMarquee.module.css).
            // Black logos (Next.js, Vercel, GitHub...) keep the white/black hover instead.
            style={
              def.mono
                ? undefined
                : ({ "--brand": def.color } as React.CSSProperties)
            }
          >
            {def.paths.map((d, i) => (
              <path
                key={i}
                d={d}
                fillRule={def.evenodd ? "evenodd" : "nonzero"}
                clipRule={def.evenodd ? "evenodd" : "nonzero"}
              />
            ))}
          </svg>
        ),
      });
    });
  });

  return items;
};

export const REAL_TECH_ITEMS: RealTechItem[] = buildItems();

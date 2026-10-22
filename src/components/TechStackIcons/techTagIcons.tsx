import React from "react";
import { BRAND_ICONS } from "../../sections/Capabilities/brandIconData";
import { TAG_BRAND_ICONS } from "./tagBrandIcons";

/**
 * Real brand logos for project tech tags (Works, All Projects, project modals).
 * - Reuses the SAME logos as the Capabilities section (brandIconData.ts)
 *   + a few extras (PHP, CSS3, HTML5, Markdown, PostgreSQL).
 * - Drawn with fill="currentColor", so the existing gray / hover styling of the
 *   tech icons keeps working exactly as before (no colours added).
 * - Tags that are NOT a real tool (e.g. "RBAC", "Manual Testing", "Admin Panel")
 *   return null so your current icon is used for them.
 */
const ALL_ICONS = { ...BRAND_ICONS, ...TAG_BRAND_ICONS };

// First match wins (more specific rules first)
const TAG_RULES: Array<[RegExp, string]> = [
  [/typescript/, "typescript"],
  [/javascript|\bjs\b|es6/, "javascript"],
  [/next\.?js/, "next"],
  [/\breact/, "react"], // React / React Native
  [/\bvue/, "vue"],
  [/tailwind/, "tailwind"],
  [/laravel/, "laravel"],
  [/mysql/, "mysql"], // "MySQL / PostgreSQL" → MySQL
  [/postgres/, "postgresql"],
  [/mongo/, "mongodb"],
  [/firebase/, "firebase"],
  [/supabase/, "supabase"],
  [/\bphp\b/, "php"],
  [/css/, "css3"],
  [/html/, "html5"],
  [/express/, "express"],
  [/\bnode/, "node"],
  [/gemini/, "gemini"],
  [/openai|chatgpt/, "openai"],
  [/claude/, "claude"],
  [/markdown/, "markdown"],
  [/\bgit\b|github/, "github"],
  [/vite/, "vite"],
  [/flutter/, "flutter"],
  [/postman/, "postman"],
  [/jira/, "jira"],
  [/asana/, "asana"],
  [/notion/, "notion"],
  [/vercel/, "vercel"],
];

export const getRealIconForTag = (
  tag: string,
  size = 24,
): React.ReactElement | null => {
  const name = tag.toLowerCase();
  const rule = TAG_RULES.find(([re]) => re.test(name));
  if (!rule) return null;

  const def = ALL_ICONS[rule[1]];
  if (!def) return null;

  return (
    <svg
      viewBox={`0 0 ${def.vb} ${def.vb}`}
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      style={{ display: "block" }}
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
  );
};

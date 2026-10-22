import React from "react";
import { BRAND_ICONS } from "../../sections/Capabilities/brandIconData";
import { TAG_BRAND_ICONS } from "./tagBrandIcons";
import { CONCEPT_ICONS } from "./conceptIcons";

/**
 * Real brand logos for project tech tags (Works, All Projects, project modals).
 * - Reuses the SAME logos as the Capabilities section (brandIconData.ts)
 *   + a few extras (PHP, CSS3, HTML5, Markdown, PostgreSQL).
 * - Drawn with fill="currentColor", so the existing gray / hover styling of the
 *   tech icons keeps working exactly as before (no colours added).
 * - Tags that are NOT a real tool (e.g. "RBAC", "Manual Testing", "Admin Panel")
 *   return null here — they get a professional concept icon from
 *   getConceptIconForTag() below (Lucide icon set).
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

/* ───────────────────────────────────────────────────────────────────────────
 * CONCEPT ICONS — for tags that are not a brand/tool
 * (RBAC, Manual Testing, Cart & Checkout, Admin Panel, Inventory ...).
 * Professional Lucide line icons, gray via currentColor like everything else.
 * To change an icon: change the key on the right of the matching rule.
 * ─────────────────────────────────────────────────────────────────────────── */
const CONCEPT_RULES: Array<[RegExp, string]> = [
  [/spatie|security|\bauth/, "rbacShield"],
  [/rbac|role|permission|access/, "rbacKey"],
  [/manual|testing|\btest|\bqa\b/, "manualTesting"],
  [/\bbugs?\b|defect/, "bug"],
  [/cart|checkout|commerce|shop/, "cart"],
  [/admin|panel|dashboard/, "adminPanel"],
  [/information|system/, "infoSystems"],
  [/\bai\b|workspace|intelligen|assistant|spark/, "aiSparkles"],
  [/queue|real-?time/, "queue"],
  [/inventory|stock|warehouse/, "inventory"],
  [/offline|sync/, "offline"],
  [/\bapi\b|endpoint|openapi|contract/, "api"],
  [/automation|playwright|\bbot\b/, "automation"],
  [/lighthouse|vital|speed|audit|performance/, "performance"],
  [/docker|container/, "container"],
];

export const getConceptIconForTag = (
  tag: string,
  size = 24,
): React.ReactElement | null => {
  const name = tag.toLowerCase();
  const rule = CONCEPT_RULES.find(([re]) => re.test(name));
  if (!rule) return null;

  const nodes = CONCEPT_ICONS[rule[1]];
  if (!nodes) return null;

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      style={{ display: "block" }}
    >
      {nodes.map(([el, attrs], i) =>
        React.createElement(el, { key: i, ...attrs }),
      )}
    </svg>
  );
};

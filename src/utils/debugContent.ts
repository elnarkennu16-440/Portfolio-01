/**
 * Dev-only helper to visually highlight content blocks still marked as "placeholder".
 * Only active in local development when the URL contains ?debug=content.
 * Tree-shaken out in production builds.
 */
export const getPlaceholderDebugAttr = (status?: "placeholder" | "final") => {
  if (!import.meta.env.DEV) return undefined;
  if (typeof window === "undefined") return undefined;
  if (status !== "placeholder") return undefined;
  if (!window.location.search.includes("debug=content")) return undefined;
  return "placeholder";
};

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Ignore all embedded agent skill folders to prevent lint failures
    "academic-research-skills/**",
    "ai-video-toolkit/**",
    "beautiful-prose/**",
    "brand-identity/**",
    "claude-design-skills-3d-motion/**",
    "color-expert/**",
    "error-handling/**",
    "frontend-design/**",
    "geo-seo-claude/**",
    "graphic-designer/**",
    "marketing-skills/**",
    "niche-research/**",
    "vibe-security-audit/**"
  ]),
]);

export default eslintConfig;

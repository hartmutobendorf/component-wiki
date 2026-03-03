// @ts-check
import { defineConfig } from "astro/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import purgecss from "astro-purgecss";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://astro.build/config
export default defineConfig({
  // Prevent Astro from inlining small CSS files so PurgeCSS can process them.
  build: {
    inlineStylesheets: "never",
  },
  integrations: [
    purgecss({
      // Keep @font-face rules – vanilla-framework loads custom fonts.
      fontFace: false,
      // Keep keyframes – used by vanilla-framework animations & Astro view transitions.
      keyframes: false,
      safelist: {
        greedy: [
          /astro/, // Astro view-transition internals
        ],
        standard: [
          "no-js", // vanilla-framework no-js fallback
        ],
      },
      // Scan source files so PurgeCSS sees classes used in Lit web-component
      // templates (shadow DOM) and Astro template expressions that don't
      // appear verbatim in the final HTML.
      content: [
        process.cwd() + "/src/**/*.{astro,ts,tsx,js,jsx}",
      ],
    }),
  ],
  image: {
    // Permit the data/raw/images directory outside the project root
    // so Astro's <Image /> and getImage() can process these files.
    service: {
      entrypoint: "astro/assets/services/sharp",
    },
  },
  vite: {
    resolve: {
      alias: {
        // Map @images/ to the shared data directory so Astro's asset
        // pipeline can find images without moving them into src/.
        "@images": path.resolve(__dirname, "../../data/raw/images"),
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          includePaths: ["node_modules"],
          quietDeps: true,
          silenceDeprecations: ["import", "global-builtin"],
        },
      },
    },
  },
});

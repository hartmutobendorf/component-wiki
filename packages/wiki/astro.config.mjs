// @ts-check
import { defineConfig } from "astro/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://astro.build/config
export default defineConfig({
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

// @ts-check
import { defineConfig } from "astro/config";
import { viteStaticCopy } from "vite-plugin-static-copy";

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [
      viteStaticCopy({
        targets: [
          {
            // Copy images from data/raw/images/ to dist/images/
            src: "../../data/raw/images/**/*.{png,jpg,jpeg,gif,svg,webp}",
            dest: "images",
          },
        ],
      }),
    ],
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

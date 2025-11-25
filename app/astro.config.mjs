// @ts-check
import { defineConfig } from 'astro/config';
import { viteStaticCopy } from 'vite-plugin-static-copy';

// https://astro.build/config
export default defineConfig({
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
      wrap: true
    }
  },
  vite: {
    plugins: [
      viteStaticCopy({
        targets: [
          {
            // Copy Figma data, images, and markdown files
            src: 'src/content/md/**/*.{html,png,jpg,jpeg,gif,svg,webp,md}',
            dest: '.',
            rename: (fileName, fileExtension, fullPath) => {
              // Extract the path after 'src/content/' to preserve md/component/... structure
              const match = fullPath.match(/src\/content\/(.+)/);
              return match ? match[1] : fileName + fileExtension;
            }
          }
        ]
      })
    ],
    css: {
      preprocessorOptions: {
        scss: {
          includePaths: ['node_modules'],
          quietDeps: true, // Silence deprecation warnings from dependencies
          silenceDeprecations: ['import', 'global-builtin'], // Silence specific deprecations
        }
      }
    }
  }
});

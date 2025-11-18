// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
      wrap: true
    }
  },
  vite: {
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

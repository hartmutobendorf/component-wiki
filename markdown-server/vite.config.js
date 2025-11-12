import { purgeCSSPlugin } from "@fullhuman/postcss-purgecss"
import { defineConfig } from "vite"

export default defineConfig({
    css: {
        preprocessorOptions: {
            scss: {
                quietDeps: true,
                logger: {
                    warn: () => {},
                    debug: () => {},
                },
            },
        },
        postcss: {
            plugins: [
                purgeCSSPlugin({
                    content: [
                        "./templates/**/*.html",
                        "./src/**/*.js",
                        "./src/**/*.ts",
                        "./src/**/*.jsx",
                        "./src/**/*.tsx",
                        "./main.py",
                    ],
                    safelist: {
                        standard: [
                            "html",
                            "body",
                            "h1",
                            "h2",
                            "h3",
                            "h4",
                            "h5",
                            "h6",
                            "p",
                            "ul",
                            "ol",
                            "li",
                            "a",
                            "strong",
                            "em",
                            "code",
                            "pre",
                            "blockquote",
                            "table",
                            "thead",
                            "tbody",
                            "tr",
                            "td",
                            "th",
                            "hr",
                            "img",
                            "br",
                        ],
                    },
                    defaultExtractor: (content) =>
                        content.match(/[\w-/:]+(?<!:)/g) || [],
                }),
            ],
        },
    },
    build: {
        rollupOptions: {
            input: {
                components: "src/components/index.js",
                page: "src/styles/page.scss",
            },
            output: {
                dir: "static",
                entryFileNames: (chunkInfo) => {
                    const facadeModuleId = chunkInfo.facadeModuleId
                    if (facadeModuleId?.includes("components")) {
                        return "js/components.js"
                    }
                    return "js/[name].js"
                },
                assetFileNames: (assetInfo) => {
                    if (assetInfo.name?.endsWith(".css")) {
                        return "css/[name][extname]"
                    }
                    return "assets/[name][extname]"
                },
            },
        },
    },
    server: {
        port: 3000,
    },
})

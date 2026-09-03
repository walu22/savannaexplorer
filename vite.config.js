import { defineConfig, loadEnv } from 'vite';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

function analyticsPlugin(mode) {
    const env = loadEnv(mode, process.cwd(), '');
    return {
        name: 'html-analytics-inject',
        transformIndexHtml(html) {
            let out = html;
            if (env.VITE_GSC_VERIFICATION) {
                out = out.replace(
                    '</head>',
                    `    <meta name="google-site-verification" content="${env.VITE_GSC_VERIFICATION}" />\n</head>`,
                );
            }
            if (env.VITE_GA4_ID) {
                const ga = `
    <script async src="https://www.googletagmanager.com/gtag/js?id=${env.VITE_GA4_ID}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${env.VITE_GA4_ID}');
    </script>`;
                out = out.replace('</head>', `${ga}\n</head>`);
            }
            return out;
        },
    };
}

function directoryIndexPreviewPlugin() {
    return {
        name: 'directory-index-preview',
        configurePreviewServer(server) {
            server.middlewares.use((request, _response, next) => {
                const url = new URL(request.url || '/', 'http://localhost');
                if (!url.pathname.includes('.') && url.pathname !== '/') {
                    const indexPath = resolve(process.cwd(), 'dist', url.pathname.replace(/^\//, ''), 'index.html');
                    if (existsSync(indexPath)) request.url = `${url.pathname.replace(/\/$/, '')}/index.html${url.search}`;
                }
                next();
            });
        },
    };
}

export default defineConfig(({ mode }) => ({
    appType: 'mpa',
    root: '.',
    publicDir: 'public',
    plugins: [analyticsPlugin(mode), directoryIndexPreviewPlugin()],
    server: {
        proxy: {
            '/api': {
                target: 'https://savannaexplorer.com',
                changeOrigin: true,
                secure: true,
            }
        }
    },
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (!id.includes('node_modules') && id.includes('/data/')) {
                        if (id.includes('countries.json') || id.includes('country-depth.json')) {
                            return 'data-countries';
                        }
                        if (id.includes('planning-guides.json') || id.includes('guides.json')) {
                            return 'data-guides';
                        }
                        if (id.includes('route-collections.json') || id.includes('route-logistics')) {
                            return 'data-routes';
                        }
                        if (id.includes('parks.json') || id.includes('park-fees')) return 'data-parks';
                        if (id.includes('borders.json')) return 'data-borders';
                        if (id.includes('itineraries.json') || id.includes('itinerary-')) return 'data-itineraries';
                        if (id.includes('stays-operators.json')) return 'data-marketplace';
                    }
                    if (id.includes('/js/modules/marketplace')) return 'mod-marketplace';
                    if (id.includes('/js/modules/trip-planner')) return 'mod-trip-planner';
                    if (id.includes('/js/modules/tourism-stats')) return 'mod-tourism-stats';
                    if (id.includes('/js/modules/discover')) return 'mod-discover';
                },
            },
        },
    },
}));

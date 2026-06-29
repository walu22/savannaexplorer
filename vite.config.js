import { defineConfig, loadEnv } from 'vite';

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

export default defineConfig(({ mode }) => ({
    appType: 'spa',
    root: '.',
    publicDir: 'public',
    plugins: [analyticsPlugin(mode)],
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
                        return 'data-misc';
                    }
                    if (id.includes('/js/modules/country-guide')) return 'mod-country-guide';
                    if (id.includes('/js/modules/marketplace')) return 'mod-marketplace';
                    if (id.includes('/js/modules/trip-planner')) return 'mod-trip-planner';
                    if (id.includes('/js/modules/planning-guides')) return 'mod-planning-guides';
                    if (id.includes('/js/modules/tourism-stats')) return 'mod-tourism-stats';
                    if (id.includes('/js/modules/discover')) return 'mod-discover';
                },
            },
        },
    },
}));

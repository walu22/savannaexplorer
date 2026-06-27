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
    },
}));

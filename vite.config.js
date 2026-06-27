import { defineConfig } from 'vite';

export default defineConfig({
    appType: 'spa',
    root: '.',
    publicDir: 'public',
    build: {
        outDir: 'dist',
        emptyOutDir: true,
    },
});

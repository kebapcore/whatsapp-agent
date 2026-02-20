import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        strictPort: false,
        host: 'localhost'
    },
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        target: 'esnext',
        minify: false
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src/renderer')
        }
    }
});

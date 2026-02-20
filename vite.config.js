import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    root: path.resolve(__dirname, '.'),
    server: {
        port: 5173,
        strictPort: false,
        host: 'localhost'
    },
    build: {
        outDir: path.resolve(__dirname, 'dist'),
        emptyOutDir: true,
        target: 'esnext',
        minify: 'terser'
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src/renderer')
        }
    }
});

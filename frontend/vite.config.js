var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import react from '@vitejs/plugin-react';
import path from 'path';
import { loadEnv } from 'vite';
import { configDefaults, defineConfig } from 'vitest/config';
export default defineConfig(function (_a) {
    var mode = _a.mode;
    var env = loadEnv(mode, process.cwd(), '');
    return {
        plugins: [react()],
        resolve: { alias: { '@': path.resolve(__dirname, './src') } },
        server: {
            port: 5173,
            proxy: {
                '/api': { target: env.VITE_GATEWAY_URL || 'http://localhost:8080', changeOrigin: true },
            },
        },
        build: { sourcemap: true, chunkSizeWarningLimit: 900 },
        test: {
            globals: true,
            environment: 'jsdom',
            setupFiles: './src/test/setup.ts',
            exclude: __spreadArray(__spreadArray([], configDefaults.exclude, true), ['e2e/**'], false),
            coverage: { provider: 'v8', reporter: ['text', 'html'] },
        },
    };
});

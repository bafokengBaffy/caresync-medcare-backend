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
    var _b;
    var mode = _a.mode;
    var env = loadEnv(mode, process.cwd(), '');
    if (mode === 'production') {
        var apiUrl = void 0;
        try {
            apiUrl = new URL((_b = env.VITE_API_BASE_URL) !== null && _b !== void 0 ? _b : '');
        }
        catch (_c) {
            throw new Error('Set VITE_API_BASE_URL to the deployed HTTPS API gateway before building for production.');
        }
        if (apiUrl.protocol !== 'https:' ||
            ['localhost', '127.0.0.1', '::1'].includes(apiUrl.hostname)) {
            throw new Error('VITE_API_BASE_URL must use HTTPS and point to a public API gateway in production.');
        }
    }
    return {
        plugins: [react()],
        resolve: { alias: { '@': path.resolve(__dirname, './src') } },
        server: {
            port: 5000,
            strictPort: true,
            proxy: {
                '/api': { target: env.VITE_GATEWAY_URL || 'http://localhost:8080', changeOrigin: true },
            },
        },
        build: { sourcemap: mode !== 'production', chunkSizeWarningLimit: 900 },
        test: {
            globals: true,
            environment: 'jsdom',
            setupFiles: './src/test/setup.ts',
            exclude: __spreadArray(__spreadArray([], configDefaults.exclude, true), ['e2e/**'], false),
            coverage: { provider: 'v8', reporter: ['text', 'html'] },
        },
    };
});

import react from '@vitejs/plugin-react';
import path from 'path';
import { loadEnv } from 'vite';
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

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
      exclude: [...configDefaults.exclude, 'e2e/**'],
      coverage: { provider: 'v8', reporter: ['text', 'html'] },
    },
  };
});

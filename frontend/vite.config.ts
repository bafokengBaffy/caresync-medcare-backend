import react from '@vitejs/plugin-react';
import path from 'path';
import { loadEnv } from 'vite';
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  if (mode === 'production') {
    let apiUrl: URL;
    try {
      apiUrl = new URL(
        env.VITE_API_BASE_URL?.trim() ||
          'https://caresync-medcare-backend.onrender.com',
      );
    } catch {
      throw new Error('VITE_API_BASE_URL must be an absolute HTTPS backend URL for production builds.');
    }

    if (
      apiUrl.protocol !== 'https:' ||
      ['localhost', '127.0.0.1', '::1'].includes(apiUrl.hostname)
    ) {
      throw new Error('VITE_API_BASE_URL must use HTTPS and point to a public backend in production.');
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
      exclude: [...configDefaults.exclude, 'e2e/**'],
      coverage: { provider: 'v8', reporter: ['text', 'html'] },
    },
  };
});

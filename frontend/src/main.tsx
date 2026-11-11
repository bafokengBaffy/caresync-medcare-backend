import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { router } from './router';
import { StartupGate } from './components/common/StartupGate';
import { ThemeController } from './components/layout/ThemeController';
import './styles/globals.css';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false } },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeController />
      <StartupGate>
        <RouterProvider router={router} />
      </StartupGate>
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  </React.StrictMode>,
);

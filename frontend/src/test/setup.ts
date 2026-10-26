import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => cleanup());

// Mock Firebase to avoid side effects in tests
vi.mock('@/lib/firebase', () => ({ app: undefined, auth: undefined }));

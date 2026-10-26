import { http, HttpResponse } from 'msw';
export const handlers = [
  http.get('/api/v1/patients', () => HttpResponse.json({ content: [], page: 1, size: 20, total: 0 })),
  http.get('/api/v1/appointments', () => HttpResponse.json({ content: [], page: 1, size: 20, total: 0 })),
  http.get('/api/v1/invoices', () => HttpResponse.json({ content: [], page: 1, size: 20, total: 0 })),
];

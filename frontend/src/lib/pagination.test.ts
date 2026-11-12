import { describe, expect, it } from 'vitest';
import { normalizePage } from './pagination';

describe('normalizePage', () => {
  it('normalizes Spring Page metadata', () => {
    expect(normalizePage({
      content: ['row'],
      number: 2,
      size: 10,
      totalElements: 21,
      totalPages: 3,
      last: false,
    })).toEqual({
      content: ['row'],
      page: 2,
      size: 10,
      total: 21,
      totalPages: 3,
      last: false,
    });
  });

  it('preserves the API page shape and derives page count when absent', () => {
    expect(normalizePage({
      content: ['row'],
      page: 0,
      size: 2,
      total: 5,
    })).toEqual({
      content: ['row'],
      page: 0,
      size: 2,
      total: 5,
      totalPages: 3,
      last: false,
    });
  });
});

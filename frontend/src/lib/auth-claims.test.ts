import { describe, expect, it } from 'vitest';
import { readAuthClaims } from './auth-claims';

describe('readAuthClaims', () => {
  it('accepts a trusted tenant administrator role and tenant UUID from Firebase claims', () => {
    expect(readAuthClaims({
      role: 'TENANT_ADMIN',
      tenant_id: '123e4567-e89b-42d3-a456-426614174000',
      specialty: 'DENTAL',
    })).toEqual({
      role: 'TENANT_ADMIN',
      tenantId: '123e4567-e89b-42d3-a456-426614174000',
      specialty: 'DENTAL',
    });
  });

  it('accepts a tenant-independent super administrator claim', () => {
    expect(readAuthClaims({ role: 'SUPER_ADMIN' })).toEqual({
      role: 'SUPER_ADMIN',
      tenantId: undefined,
      specialty: undefined,
    });
  });

  it('rejects tenant-scoped sessions without valid server-issued tenant claims', () => {
    expect(readAuthClaims({ role: 'ADMIN' })).toBeNull();
    expect(readAuthClaims({ role: 'ADMIN', tenant_id: '123e4567-e89b-42d3-a456-426614174000' })).toBeNull();
  });

  it('ignores malformed optional specialty claims', () => {
    expect(readAuthClaims({
      role: 'TENANT_ADMIN',
      tenant_id: '123e4567-e89b-42d3-a456-426614174000',
      specialty: 'UNKNOWN',
    })).toEqual({
      role: 'TENANT_ADMIN',
      tenantId: '123e4567-e89b-42d3-a456-426614174000',
      specialty: undefined,
    });
  });
});

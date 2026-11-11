import { describe, expect, it } from 'vitest';
import { validateImageFile } from '@/lib/image-validation';

describe('validateImageFile', () => {
  it.each([
    ['image/jpeg', 'portrait.jpeg', [0xff, 0xd8, 0xff]],
    ['image/png', 'portrait.png', [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
    ['image/webp', 'portrait.webp', [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]],
  ])('accepts a valid %s image', async (mimeType, name, signature) => {
    const file = new File([Uint8Array.from(signature)], name, { type: mimeType });
    await expect(validateImageFile(file)).resolves.toBe(mimeType);
  });

  it('rejects unsupported formats before uploading', async () => {
    const file = new File(['<svg></svg>'], 'avatar.svg', { type: 'image/svg+xml' });
    await expect(validateImageFile(file)).rejects.toThrow('Choose a JPG, PNG, or WebP image.');
  });

  it('rejects image data whose signature does not match its declared type', async () => {
    const file = new File(['not a png'], 'avatar.png', { type: 'image/png' });
    await expect(validateImageFile(file)).rejects.toThrow('file contents do not match');
  });

  it('rejects files that exceed the configured size limit', async () => {
    const file = new File(['12345'], 'avatar.png', { type: 'image/png' });
    await expect(validateImageFile(file, 4)).rejects.toThrow('Choose an image no larger than');
  });
});

const IMAGE_TYPES = {
  'image/jpeg': { extension: 'jpg', signature: [0xff, 0xd8, 0xff] },
  'image/png': { extension: 'png', signature: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  'image/webp': { extension: 'webp', signature: [0x52, 0x49, 0x46, 0x46] },
} as const;

export type AllowedImageType = keyof typeof IMAGE_TYPES;
const DEFAULT_MAX_SIZE = 5 * 1024 * 1024;
const BYTES_PER_MEGABYTE = 1024 * 1024;

function isAllowedImageType(value: string): value is AllowedImageType {
  return Object.prototype.hasOwnProperty.call(IMAGE_TYPES, value);
}

export function formatFileSizeLimit(maxSizeBytes: number): string {
  if (!Number.isFinite(maxSizeBytes) || maxSizeBytes <= 0) return 'unavailable';
  if (maxSizeBytes >= BYTES_PER_MEGABYTE) {
    return `${Number((maxSizeBytes / BYTES_PER_MEGABYTE).toFixed(1))} MB`;
  }
  return `${Math.max(1, Math.ceil(maxSizeBytes / 1024))} KB`;
}

async function readFileHeader(file: File): Promise<Uint8Array> {
  const header = file.slice(0, 12);
  if (typeof header.arrayBuffer === 'function') {
    return new Uint8Array(await header.arrayBuffer());
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () =>
      reject(reader.error ?? new Error('The selected image could not be read.'));
    reader.onabort = () => reject(new Error('Reading the selected image was interrupted.'));
    reader.onload = () => {
      if (!(reader.result instanceof ArrayBuffer)) {
        reject(new Error('The selected image could not be read.'));
        return;
      }
      resolve(new Uint8Array(reader.result));
    };
    reader.readAsArrayBuffer(header);
  });
}

export async function validateImageFile(
  file: File,
  maxSizeBytes = DEFAULT_MAX_SIZE,
): Promise<AllowedImageType> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  const declaredType = file.type.toLowerCase();

  if (!isAllowedImageType(declaredType)) {
    throw new Error('Choose a JPG, PNG, or WebP image.');
  }
  const mimeType = declaredType;
  const definition = IMAGE_TYPES[mimeType];
  if (extension !== definition.extension && !(mimeType === 'image/jpeg' && extension === 'jpeg')) {
    throw new Error('Choose a JPG, PNG, or WebP image.');
  }
  if (!Number.isFinite(maxSizeBytes) || maxSizeBytes <= 0) {
    throw new Error('The image size limit is not configured correctly.');
  }
  if (file.size === 0 || file.size > maxSizeBytes) {
    throw new Error(`Choose an image no larger than ${formatFileSizeLimit(maxSizeBytes)}.`);
  }

  const header = await readFileHeader(file);
  const signatureMatches = definition.signature.every((byte, index) => header[index] === byte);
  const webpMarkerMatches =
    mimeType !== 'image/webp' ||
    [0x57, 0x45, 0x42, 0x50].every((byte, index) => header[index + 8] === byte);
  if (!signatureMatches || !webpMarkerMatches) {
    throw new Error('The selected file contents do not match a supported image format.');
  }

  return mimeType;
}

export function getImageExtension(mimeType: AllowedImageType): string {
  return IMAGE_TYPES[mimeType].extension;
}

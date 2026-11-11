import { useId, useRef, useState, type ChangeEvent } from 'react';
import { ImagePlus, LoaderCircle, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase';
import { formatFileSizeLimit, getImageExtension, validateImageFile } from '@/lib/image-validation';
import { getSupabaseClient } from '@/lib/supabase';

const STORAGE_BUCKET = 'caresync bucket';
const DEFAULT_MAX_SIZE = 5 * 1024 * 1024;

export interface ImageUploadProps {
  onUpload?: (publicUrl: string) => void | Promise<void>;
  uploadFile?: (file: File) => Promise<string>;
  currentImageUrl?: string;
  fallbackText?: string;
  disabled?: boolean;
  maxSizeBytes?: number;
  className?: string;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'The image could not be uploaded. Please try again.';
}

export function ImageUpload({
  onUpload,
  uploadFile,
  currentImageUrl,
  fallbackText,
  disabled = false,
  maxSizeBytes = DEFAULT_MAX_SIZE,
  className,
}: ImageUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | undefined>();
  const imageUrl = uploadedImageUrl ?? currentImageUrl;

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;

    setErrorMessage(null);
    setIsUploading(true);
    try {
      const mimeType = await validateImageFile(file, maxSizeBytes);
      const user = auth.currentUser;
      if (!user) throw new Error('Sign in before uploading a profile image.');

      let publicUrl: string;
      if (uploadFile) {
        publicUrl = await uploadFile(file);
      } else {
        const extension = getImageExtension(mimeType);
        const objectPath = `${user.uid}/${crypto.randomUUID()}.${extension}`;
        const storage = getSupabaseClient().storage.from(STORAGE_BUCKET);
        const { error } = await storage.upload(objectPath, file, {
          cacheControl: '3600',
          contentType: mimeType,
          upsert: false,
        });
        if (error) throw new Error(`Image upload failed: ${error.message}`);

        const { data } = storage.getPublicUrl(objectPath);
        if (!data.publicUrl)
          throw new Error('The image was uploaded, but a public URL was not returned.');
        publicUrl = data.publicUrl;
      }

      await onUpload?.(publicUrl);
      setUploadedImageUrl(publicUrl);
    } catch (uploadError) {
      setErrorMessage(getErrorMessage(uploadError));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={className}>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt="Profile"
          className="mb-3 h-24 w-24 rounded-full border border-slate-200 object-cover dark:border-slate-700"
        />
      ) : (
        <div
          aria-hidden="true"
          className="mb-3 flex h-24 w-24 items-center justify-center rounded-full border border-dashed border-slate-300 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
        >
          {fallbackText || <ImagePlus className="h-8 w-8" />}
        </div>
      )}
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        disabled={disabled || isUploading}
        onChange={handleFileChange}
        aria-describedby={errorMessage ? `${inputId}-error` : `${inputId}-help`}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={disabled || isUploading}
          onClick={() => inputRef.current?.click()}
        >
          {isUploading ? (
            <LoaderCircle aria-hidden="true" className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <UploadCloud aria-hidden="true" className="mr-2 h-4 w-4" />
          )}
          {isUploading ? 'Uploading…' : 'Upload image'}
        </Button>
        <p id={`${inputId}-help`} className="text-sm text-muted-foreground dark:text-slate-400">
          JPG, PNG, or WebP. Maximum {formatFileSizeLimit(maxSizeBytes)}.
        </p>
      </div>
      {errorMessage && (
        <p
          id={`${inputId}-error`}
          role="alert"
          className="mt-2 text-sm text-red-700 dark:text-red-400"
        >
          {errorMessage}
        </p>
      )}
    </div>
  );
}

// Phase 1E client-side pre-validation for the asset-upload form.
// UX-only: a deliberate, small duplicate of assetValidation.ts's rules
// (CMS-PO-010(R2)-D / Secondary Decision 4) so the browser can reject an
// obviously-invalid file before even requesting upload authorization.
// `@acos/core-cms` is not imported here as a runtime value — it pulls in
// server-only dependencies (pg, the R2/AWS SDK) that must never ship to
// the browser. The server (`validateAssetCandidate` at authorization time,
// and again against R2's actual `headObject()` at completion time) remains
// the sole authority; this file enforces nothing on its own.

export const MAX_ASSET_BYTES = 500 * 1024 * 1024;

const ASSET_EXTENSIONS: Readonly<Record<string, readonly string[]>> = {
  pdf: ['application/pdf'],
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  pptx: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  zip: ['application/zip', 'application/x-zip-compressed'],
  jpg: ['image/jpeg'],
  jpeg: ['image/jpeg'],
  png: ['image/png'],
  webp: ['image/webp'],
  mp4: ['video/mp4'],
};

/** For the file input's `accept` attribute — extensions only; the server/`validateAssetFile` still check actual MIME type. */
export const ACCEPTED_FILE_EXTENSIONS = Object.keys(ASSET_EXTENSIONS)
  .map((ext) => `.${ext}`)
  .join(',');

export function extensionFromFileName(fileName: string): string {
  const match = /\.([^./\\]+)$/.exec(fileName);
  return match ? match[1]!.toLowerCase() : '';
}

export interface AssetFileValidationError {
  field: 'extension' | 'contentType' | 'bytes';
  message: string;
}

/** Mirrors assetValidation.ts's validateAssetCandidate, for the browser's own candidate file. Returns null when the file passes every basic check. */
export function validateAssetFile(file: { name: string; type: string; size: number }): AssetFileValidationError | null {
  const extension = extensionFromFileName(file.name);
  const allowedMimeTypes = ASSET_EXTENSIONS[extension];
  if (!allowedMimeTypes) {
    return { field: 'extension', message: `'.${extension || '?'}' is not an approved file type.` };
  }
  if (!allowedMimeTypes.includes(file.type)) {
    return { field: 'contentType', message: `This file's type ('${file.type}') does not match its '.${extension}' extension.` };
  }
  if (file.size <= 0) {
    return { field: 'bytes', message: 'This file is empty.' };
  }
  if (file.size > MAX_ASSET_BYTES) {
    return { field: 'bytes', message: 'Files must be 500 MB or smaller.' };
  }
  return null;
}

import { describe, expect, it } from 'vitest';

import { extensionFromFileName, validateAssetFile } from './assetUpload';

describe('extensionFromFileName', () => {
  it('returns the lowercased extension', () => {
    expect(extensionFromFileName('Report.PDF')).toBe('pdf');
  });

  it('returns an empty string when there is no extension', () => {
    expect(extensionFromFileName('README')).toBe('');
  });
});

describe('validateAssetFile', () => {
  it('passes a valid PDF', () => {
    expect(validateAssetFile({ name: 'guide.pdf', type: 'application/pdf', size: 1024 })).toBeNull();
  });

  it('rejects an unapproved extension', () => {
    const result = validateAssetFile({ name: 'installer.exe', type: 'application/x-msdownload', size: 1024 });
    expect(result?.field).toBe('extension');
  });

  it('rejects a content type that does not match its extension', () => {
    const result = validateAssetFile({ name: 'guide.pdf', type: 'image/png', size: 1024 });
    expect(result?.field).toBe('contentType');
  });

  it('rejects an empty file', () => {
    const result = validateAssetFile({ name: 'guide.pdf', type: 'application/pdf', size: 0 });
    expect(result?.field).toBe('bytes');
  });

  it('rejects a file over the 500MB limit', () => {
    const result = validateAssetFile({ name: 'video.mp4', type: 'video/mp4', size: 500 * 1024 * 1024 + 1 });
    expect(result?.field).toBe('bytes');
  });

  it('accepts a file exactly at the 500MB limit', () => {
    expect(validateAssetFile({ name: 'video.mp4', type: 'video/mp4', size: 500 * 1024 * 1024 })).toBeNull();
  });
});

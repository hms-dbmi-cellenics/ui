// fzstdDecompress.js
// Utility to decompress zstd-compressed Uint8Array using fzstd (pure JS)
import * as fzstd from 'fzstd';

export function isZstdCompressed(data) {
  // Zstd magic bytes: 0x28B52FFD
  return (
    data instanceof Uint8Array &&
    data.length > 4 &&
    data[0] === 0x28 && data[1] === 0xB5 && data[2] === 0x2F && data[3] === 0xFD
  );
}

export function zstdDecompress(data) {
  return fzstd.decompress(data);
}

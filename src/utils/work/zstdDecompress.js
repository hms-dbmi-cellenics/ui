// zstdDecompress.js
// Utility to decompress zstd-compressed Uint8Array using zstd-codec (WASM)

let ZstdCodecPromise = null;

export function isZstdCompressed(data) {
  // Zstd magic bytes: 0x28B52FFD
  return (
    data instanceof Uint8Array &&
    data.length > 4 &&
    data[0] === 0x28 && data[1] === 0xB5 && data[2] === 0x2F && data[3] === 0xFD
  );
}

export async function zstdDecompress(data) {
  if (!ZstdCodecPromise) {
    ZstdCodecPromise = new Promise((resolve) => {
      // Dynamically import zstd-codec only when needed
      import('zstd-codec').then(({ ZstdCodec }) => {
        ZstdCodec.run((zstd) => {
          resolve(zstd);
        });
      });
    });
  }
  const zstd = await ZstdCodecPromise;
  const simple = new zstd.Simple();
  const decompressed = simple.decompress(data);
  return decompressed;
}

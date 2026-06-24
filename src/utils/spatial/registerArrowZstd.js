import { compressionRegistry, CompressionType } from 'apache-arrow';
import { decompress } from 'fzstd';

// apache-arrow JS (>= 21.1.0) ships the IPC compression framework but registers
// NO codecs by default, so reading a ZSTD-compressed Arrow body throws
// ("Record batch compression not implemented" on older arrow; an unregistered-codec
// error on 21+) unless we register a decoder. The pipeline writes the per-gene
// molecule Feathers with a ZSTD body (handle_data.R upload_molecules_to_s3), so
// register fzstd as the ZSTD *decoder*.
//
// Decode-only (no encode): the registry runs its encode-validation only when a
// codec exposes an encode method, so omitting it registers cleanly — and the
// browser never writes Arrow, it only reads. Side-effect import: pulling in the
// molecule reader registers the codec before any tile is parsed.
compressionRegistry.set(CompressionType.ZSTD, {
  decode: (bytes) => decompress(bytes),
});

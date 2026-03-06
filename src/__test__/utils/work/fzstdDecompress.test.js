import { isZstdCompressed, zstdDecompress } from 'utils/work/fzstdDecompress';
import * as fzstd from 'fzstd';

jest.mock('fzstd', () => ({
  decompress: jest.fn((data) => {
    // Mock decompression: just return a simple JSON string
    // In real scenario, would decompress zstd data
    if (data[0] === 0x28 && data[1] === 0xB5 && data[2] === 0x2F && data[3] === 0xFD) {
      // Valid zstd magic bytes - return mock decompressed data
      return new Uint8Array([123, 34, 97, 34, 58, 49, 125]); // '{"a":1}'
    }
    throw new Error('Invalid zstd data');
  }),
}));

describe('fzstdDecompress - isZstdCompressed', () => {
  it('correctly identifies valid zstd magic bytes', () => {
    const zstdData = new Uint8Array([0x28, 0xB5, 0x2F, 0xFD, 0x00, 0x00, 0x00]);
    expect(isZstdCompressed(zstdData)).toBe(true);
  });

  it('rejects non-zstd data (fflate magic bytes)', () => {
    // fflate magic bytes: 0x78 0x9C
    const fflateData = new Uint8Array([0x78, 0x9C, 0x00, 0x00]);
    expect(isZstdCompressed(fflateData)).toBe(false);
  });

  it('rejects data with partial magic bytes', () => {
    const partialData = new Uint8Array([0x28, 0xB5, 0x2F]);
    expect(isZstdCompressed(partialData)).toBe(false);
  });

  it('rejects short data (less than 4 bytes)', () => {
    const shortData = new Uint8Array([0x28, 0xB5]);
    expect(isZstdCompressed(shortData)).toBe(false);
  });

  it('rejects non-Uint8Array input (string)', () => {
    const stringData = '{"a": 1}';
    expect(isZstdCompressed(stringData)).toBe(false);
  });

  it('rejects non-Uint8Array input (regular array)', () => {
    const arrayData = [0x28, 0xB5, 0x2F, 0xFD];
    expect(isZstdCompressed(arrayData)).toBe(false);
  });

  it('rejects non-Uint8Array input (null)', () => {
    expect(isZstdCompressed(null)).toBe(false);
  });

  it('rejects non-Uint8Array input (undefined)', () => {
    expect(isZstdCompressed(undefined)).toBe(false);
  });
});

describe('fzstdDecompress - zstdDecompress', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('decompresses valid zstd data', () => {
    const zstdData = new Uint8Array([0x28, 0xB5, 0x2F, 0xFD, 0x50, 0x00]);
    const result = zstdDecompress(zstdData);
    expect(result).toEqual(new Uint8Array([123, 34, 97, 34, 58, 49, 125])); // '{"a":1}'
  });

  it('throws error on invalid zstd data', () => {
    const invalidData = new Uint8Array([0x00, 0x00, 0x00, 0x00]);
    expect(() => {
      zstdDecompress(invalidData);
    }).toThrow();
  });

  it('calls fzstd.decompress with provided data', () => {
    const zstdData = new Uint8Array([0x28, 0xB5, 0x2F, 0xFD, 0x50, 0x00]);

    zstdDecompress(zstdData);

    expect(fzstd.decompress).toHaveBeenCalledWith(zstdData);
  });
});

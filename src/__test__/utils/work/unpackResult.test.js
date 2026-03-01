import { decompress } from 'fflate';

import unpackResult, { decompressUint8Array } from 'utils/work/unpackResult';
import * as fzstdDecompress from 'utils/work/fzstdDecompress';

jest.mock('fflate', () => ({
  __esModule: true,
  decompress: jest.fn(),
}));

jest.mock('utils/work/fzstdDecompress');

describe('unpackResult with json result', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('works correctly', async () => {
    const storageArrayBuffer = new ArrayBuffer();

    const storageResp = { arrayBuffer: () => Promise.resolve(storageArrayBuffer) };

    const decompressedUint8 = new Uint8Array();

    decompress.mockImplementation((aUint8array, callback) => {
      callback(null, decompressedUint8);
    });

    fzstdDecompress.isZstdCompressed.mockReturnValue(false);

    const result = await unpackResult(storageResp);

    expect(decompress).toHaveBeenCalledTimes(1);

    expect(result).toEqual(decompressedUint8);
  });

  it('rejects if decompress fails', async () => {
    const storageArrayBuffer = new ArrayBuffer();

    const storageResp = { arrayBuffer: () => Promise.resolve(storageArrayBuffer) };

    decompress.mockImplementation((aUint8array, callback) => {
      callback('someError', null);
    });

    fzstdDecompress.isZstdCompressed.mockReturnValue(false);

    await expect(unpackResult(storageResp)).rejects.toEqual('someError');
  });

  it('returns raw Uint8Array for zstd-compressed data (passes to downstream parser)', async () => {
    const zstdData = new Uint8Array([0x28, 0xB5, 0x2F, 0xFD, 1, 2, 3, 4]);

    fzstdDecompress.isZstdCompressed.mockReturnValue(true);

    const result = await decompressUint8Array(zstdData);

    expect(fzstdDecompress.isZstdCompressed).toHaveBeenCalledWith(zstdData);
    expect(decompress).not.toHaveBeenCalled();
    expect(result).toEqual(zstdData);
  });

  it('decompresses non-zstd data with fflate', async () => {
    const fflateData = new Uint8Array([1, 2, 3, 4, 5]);
    const decompressedData = new Uint8Array([10, 20, 30]);

    fzstdDecompress.isZstdCompressed.mockReturnValue(false);

    decompress.mockImplementation((data, callback) => {
      callback(null, decompressedData);
    });

    const result = await decompressUint8Array(fflateData);

    expect(fzstdDecompress.isZstdCompressed).toHaveBeenCalledWith(fflateData);
    expect(decompress).toHaveBeenCalledWith(fflateData, expect.any(Function));
    expect(result).toEqual(decompressedData);
  });

  it('returns blob for DownloadAnnotSeuratObject task', async () => {
    const testBlob = new Blob(['test data']);

    const storageResp = { blob: () => Promise.resolve(testBlob) };

    const result = await unpackResult(storageResp, 'DownloadAnnotSeuratObject');

    expect(result).toEqual(testBlob);
  });

  it('returns blob for GetNormalizedExpression task', async () => {
    const testBlob = new Blob(['test data']);

    const storageResp = { blob: () => Promise.resolve(testBlob) };

    const result = await unpackResult(storageResp, 'GetNormalizedExpression');

    expect(result).toEqual(testBlob);
  });
});

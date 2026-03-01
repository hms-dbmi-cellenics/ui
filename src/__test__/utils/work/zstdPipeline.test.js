import { decompress as fflateDecompress } from 'fflate';

import unpackResult, { decompressUint8Array } from 'utils/work/unpackResult';
import parseResult from 'utils/work/parseResult';
import * as fzstdDecompress from 'utils/work/fzstdDecompress';

jest.mock('fflate', () => ({
  __esModule: true,
  decompress: jest.fn(),
}));

jest.mock('utils/work/fzstdDecompress');

describe('zstd decompression pipeline end-to-end', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('unpacks and parses zstd-compressed JSON end-to-end', async () => {
    const testData = { genes: ['CD4', 'CD8'], cells: 1000 };
    const jsonString = JSON.stringify(testData);
    const jsonBytes = new TextEncoder().encode(jsonString);
    const zstdData = new Uint8Array([0x28, 0xB5, 0x2F, 0xFD, ...jsonBytes]);

    fzstdDecompress.isZstdCompressed.mockReturnValue(true);
    fzstdDecompress.zstdDecompress.mockReturnValue(jsonBytes);

    // Unpack should return raw zstd data
    const storageResp = { arrayBuffer: () => Promise.resolve(zstdData.buffer) };
    const unpackedData = await unpackResult(storageResp);

    expect(unpackedData).toEqual(zstdData);
    expect(fzstdDecompress.isZstdCompressed).toHaveBeenCalledTimes(1);

    // Parse should decompress and parse JSON
    const parsedData = await parseResult(unpackedData, 'GeneExpression');

    expect(parsedData).toEqual(testData);
    expect(fzstdDecompress.zstdDecompress).toHaveBeenCalledTimes(1);
  });

  it('unpacks and parses fflate-compressed JSON (backward compatibility)', async () => {
    const testData = { genes: ['CD4', 'CD8'], cells: 1000 };
    const jsonString = JSON.stringify(testData);
    const jsonBytes = new Uint8Array(new TextEncoder().encode(jsonString));
    const fflateCompressed = new Uint8Array([1, 2, 3, 4, 5]);

    fzstdDecompress.isZstdCompressed.mockReturnValue(false);

    fflateDecompress.mockImplementation((data, callback) => {
      // Simulate fflate decompressing to JSON bytes
      callback(null, jsonBytes);
    });

    // Unpack should decompress fflate
    const storageResp = { arrayBuffer: () => Promise.resolve(fflateCompressed.buffer) };
    const unpackedData = await unpackResult(storageResp);

    expect(unpackedData).toEqual(jsonBytes);

    // Parse should parse JSON from decompressed data
    const parsedData = await parseResult(unpackedData, 'GeneExpression');

    expect(parsedData).toEqual(testData);
  });

  it('decompresses fflate then parses JSON separately', async () => {
    const testData = { type: 'fflate', value: 100 };
    const jsonString = JSON.stringify(testData);
    const jsonBytes = new Uint8Array(new TextEncoder().encode(jsonString));

    fzstdDecompress.isZstdCompressed.mockReturnValue(false);

    fflateDecompress.mockImplementation((data, callback) => {
      callback(null, jsonBytes);
    });

    // Test decompressUint8Array directly with fflate
    const fflateData = new Uint8Array([1, 2, 3, 4, 5]);
    const decompressedData = await decompressUint8Array(fflateData);

    expect(decompressedData).toEqual(jsonBytes);

    // Then parse the result
    const parsedData = await parseResult(decompressedData, 'Task');

    expect(parsedData).toEqual(testData);
  });

  it('handles large zstd-compressed data', async () => {
    // Create large dataset
    const largeArray = Array.from({ length: 10000 }, (_, i) => i);
    const testData = { largeArray };
    const jsonString = JSON.stringify(testData);
    const jsonBytes = new TextEncoder().encode(jsonString);
    const zstdData = new Uint8Array([0x28, 0xB5, 0x2F, 0xFD, ...jsonBytes]);

    fzstdDecompress.isZstdCompressed.mockReturnValue(true);
    fzstdDecompress.zstdDecompress.mockReturnValue(jsonBytes);

    const storageResp = { arrayBuffer: () => Promise.resolve(zstdData.buffer) };
    const unpackedData = await unpackResult(storageResp);
    const parsedData = await parseResult(unpackedData, 'LargeDataTask');

    expect(parsedData.largeArray).toHaveLength(10000);
    expect(parsedData.largeArray[0]).toEqual(0);
    expect(parsedData.largeArray[9999]).toEqual(9999);
  });

  it('handles decompression errors gracefully', async () => {
    const zstdData = new Uint8Array([0x28, 0xB5, 0x2F, 0xFD, 1, 2, 3, 4]);

    fzstdDecompress.isZstdCompressed.mockReturnValue(false);
    fflateDecompress.mockImplementation((data, callback) => {
      callback('Decompression failed', null);
    });

    const storageResp = { arrayBuffer: () => Promise.resolve(zstdData.buffer) };

    await expect(unpackResult(storageResp)).rejects.toEqual('Decompression failed');
  });

  it('decompressUint8Array returns raw zstd without calling fflate', async () => {
    const zstdData = new Uint8Array([0x28, 0xB5, 0x2F, 0xFD, 1, 2, 3, 4]);

    fzstdDecompress.isZstdCompressed.mockReturnValue(true);

    const result = await decompressUint8Array(zstdData);

    expect(result).toEqual(zstdData);
    expect(fflateDecompress).not.toHaveBeenCalled();
  });
});

import parseResult from 'utils/work/parseResult';
import * as fzstdDecompress from 'utils/work/fzstdDecompress';

jest.mock('utils/work/fzstdDecompress');

describe('unpackResult with json result', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('default parsing is json from string', async () => {
    const testData = { a: 10 };
    const jsonString = JSON.stringify(testData);

    const result = await parseResult(jsonString, 'RandomWorkRequest');
    expect(result).toEqual(testData);
  });

  it('GetNormalizedExpression parser is identity (leave it like that)', async () => {
    const storageArrayBuffer = new ArrayBuffer(10);

    const result = await parseResult(storageArrayBuffer, 'GetNormalizedExpression');
    expect(result).toEqual(storageArrayBuffer);
  });

  it('parses zstd-compressed JSON data', async () => {
    const testData = { markers: ['CD4', 'CD8'] };
    const jsonString = JSON.stringify(testData);
    const jsonBytes = new TextEncoder().encode(jsonString);
    const zstdData = new Uint8Array([0x28, 0xB5, 0x2F, 0xFD, ...jsonBytes]);

    fzstdDecompress.isZstdCompressed.mockReturnValue(true);
    fzstdDecompress.zstdDecompress.mockReturnValue(jsonBytes);

    const result = await parseResult(zstdData, 'GeneExpression');

    expect(fzstdDecompress.isZstdCompressed).toHaveBeenCalledWith(zstdData);
    expect(fzstdDecompress.zstdDecompress).toHaveBeenCalledWith(zstdData);
    expect(result).toEqual(testData);
  });

  it('parses non-zstd Uint8Array JSON', async () => {
    const testData = { a: 20 };
    const jsonString = JSON.stringify(testData);
    const jsonBytes = new Uint8Array(new TextEncoder().encode(jsonString));

    fzstdDecompress.isZstdCompressed.mockReturnValue(false);

    const result = await parseResult(jsonBytes, 'RandomWorkRequest');

    expect(fzstdDecompress.isZstdCompressed).toHaveBeenCalledWith(jsonBytes);
    expect(fzstdDecompress.zstdDecompress).not.toHaveBeenCalled();
    expect(result).toEqual(testData);
  });

  it('DownloadAnnotSeuratObject parser is identity', async () => {
    const storageArrayBuffer = new ArrayBuffer(20);

    const result = await parseResult(storageArrayBuffer, 'DownloadAnnotSeuratObject');
    expect(result).toEqual(storageArrayBuffer);
  });

  it('throws error for invalid JSON string', async () => {
    const invalidJson = 'not valid json';

    await expect(parseResult(invalidJson, 'RandomWorkRequest')).rejects.toThrow();
  });

  it('throws error for invalid Uint8Array (not JSON)', async () => {
    fzstdDecompress.isZstdCompressed.mockReturnValue(false);
    const invalidData = new Uint8Array([0xFF, 0xFE, 0xFD, 0xFC]);

    await expect(parseResult(invalidData, 'RandomWorkRequest')).rejects.toThrow();
  });

  it('throws error for unknown result format', async () => {
    const unknownData = { some: 'object' }; // not string, not Uint8Array

    await expect(parseResult(unknownData, 'RandomWorkRequest')).rejects.toThrow('Unknown result format');
  });
});

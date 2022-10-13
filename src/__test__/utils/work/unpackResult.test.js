import { decompress } from 'fflate';
// eslint-disable-next-line camelcase
import { JSON_parse } from 'uint8array-json-parser';

import unpackResult from 'utils/work/unpackResult';

jest.mock('fflate', () => ({
  __esModule: true, // this property makes it work
  decompress: jest.fn(),
}));

jest.mock('uint8array-json-parser', () => ({
  __esModule: true, // this property makes it work
  JSON_parse: jest.fn(),
}));

describe('unpackResult with json result', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('works correctly', async () => {
    const storageArrayBuffer = new ArrayBuffer();

    const storageResp = { arrayBuffer: () => Promise.resolve(storageArrayBuffer) };

    const decompressedUint8 = new Uint8Array();
    const decompressedObject = { hi: 'bye' };

    decompress.mockImplementation((aUint8array, callback) => {
      callback(null, decompressedUint8);
    });

    JSON_parse.mockImplementation(() => decompressedObject);

    const result = await unpackResult(storageResp, true);

    expect(decompress).toHaveBeenCalledTimes(1);
    expect(JSON_parse).toHaveBeenCalledWith(decompressedUint8);

    expect(result).toEqual(decompressedObject);
  });

  it('rejects if decompress fails', async () => {
    const storageArrayBuffer = new ArrayBuffer();

    const storageResp = { arrayBuffer: () => Promise.resolve(storageArrayBuffer) };

    decompress.mockImplementation((aUint8array, callback) => {
      callback('someError', null);
    });

    await expect(unpackResult(storageResp, true)).rejects.toEqual('someError');
  });
});

describe('unpackResult with non-json result', () => {
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

    const result = await unpackResult(storageResp, false);

    expect(decompress).toHaveBeenCalledTimes(1);
    expect(JSON_parse).not.toHaveBeenCalled();

    expect(result).toEqual(decompressedUint8);
  });

  it('rejects if decompress fails', async () => {
    const storageArrayBuffer = new ArrayBuffer();

    const storageResp = { arrayBuffer: () => Promise.resolve(storageArrayBuffer) };

    decompress.mockImplementation((aUint8array, callback) => {
      callback('someError', null);
    });

    await expect(unpackResult(storageResp, true)).rejects.toEqual('someError');
  });
});

import { decompress } from 'fflate';

import unpackResult from 'utils/work/unpackResult';

jest.mock('fflate', () => ({
  __esModule: true, // this property makes it work
  decompress: jest.fn(),
}));

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

    await expect(unpackResult(storageResp)).rejects.toEqual('someError');
  });
});

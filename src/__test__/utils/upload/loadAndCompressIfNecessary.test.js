import { gzip } from 'fflate';

import loadAndCompressIfNecessary from 'utils/upload/loadAndCompressIfNecessary';

jest.mock('fflate', () => ({
  gzip: jest.fn(),
}));

jest.mock('utils/upload/readFileToBuffer', () => (fileObject) => Promise.resolve(Buffer.from(fileObject)));

const mockContent = 'mock_file';

describe('loadAndCompressIfNecessary', () => {
  it('Does not compress file if file is compressed', async () => {
    const uncompressedFile = {
      fileObject: mockContent,
      compressed: true,
    };

    const result = await loadAndCompressIfNecessary(uncompressedFile);

    expect(result.toString()).toEqual(mockContent);
    expect(gzip).not.toHaveBeenCalled();
  });

  it('Compresses file if not compressed', async () => {
    const compressedFile = {
      fileObject: mockContent,
      compressed: false,
    };

    gzip.mockImplementation((buffer, opt, fn) => {
      fn(null, buffer);
    });

    const result = await loadAndCompressIfNecessary(compressedFile);

    expect(result.toString()).toEqual(mockContent);
    expect(gzip).toHaveBeenCalledTimes(1);
  });

  it('Throws an error if there is an error while compressing file', async () => {
    const uncompressedFile = {
      fileObject: mockContent,
      compressed: false,
    };

    const errorString = 'some error';
    const mockError = new Error(errorString);

    gzip.mockImplementation((buffer, opt, fn) => {
      fn(mockError, buffer);
    });

    await expect(loadAndCompressIfNecessary(uncompressedFile)).rejects.toThrow('error');
  });
});

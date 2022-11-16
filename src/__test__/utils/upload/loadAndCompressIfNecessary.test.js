import loadAndCompressIfNecessary from 'utils/upload/loadAndCompressIfNecessary';
import mockFile from '__test__/test-utils/mockFile';

import { gzip } from 'fflate';

jest.mock('fflate', () => ({
  gzip: jest.fn(),
}));

const mockContent = 'mock_file';

describe('loadAndCompressIfNecessary', () => {
  it('compresses a file', async () => {
    const uncompressedFile = {
      fileObject: mockFile('features.tsv'),
    };

    gzip.mockImplementation((buffer, opt, fn) => {
      fn(null, buffer);
    });

    const mockOnCompression = jest.fn();

    const result = await loadAndCompressIfNecessary(uncompressedFile, mockOnCompression);

    expect(gzip).toHaveBeenCalledTimes(1);
    expect(mockOnCompression).toHaveBeenCalledTimes(1);
    expect(result.toString()).toEqual(mockContent);
  });

  it('Throws an error if there is an error while compressing file', async () => {
    const uncompressedFile = {
      fileObject: mockFile('features.tsv'),
    };

    const errorString = 'some error';
    const mockError = new Error(errorString);

    gzip.mockImplementation((buffer, opt, fn) => {
      fn(mockError, buffer);
    });

    await expect(loadAndCompressIfNecessary(uncompressedFile)).rejects.toThrow('error');
  });
});

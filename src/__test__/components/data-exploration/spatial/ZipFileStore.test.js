import { unzip } from 'unzipit';
import ZipFileStore from 'components/data-exploration/spatial/ZipFileStore';

jest.mock('unzipit', () => ({
  unzip: jest.fn(() => Promise.resolve({ entries: {} })),
}));

describe('ZipFileStore.fromUrl', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ZipFileStore.clearCache();
  });

  it('Reuses the store (and its central directory) for the same url', () => {
    const a = ZipFileStore.fromUrl('https://example.com/a.zip');
    const b = ZipFileStore.fromUrl('https://example.com/a.zip');
    const c = ZipFileStore.fromUrl('https://example.com/c.zip');

    expect(b).toBe(a);
    expect(c).not.toBe(a);
    expect(unzip).toHaveBeenCalledTimes(2);
  });

  it('Drops a store whose zip failed to open', async () => {
    unzip.mockImplementationOnce(() => Promise.reject(new Error('404')));

    const failed = ZipFileStore.fromUrl('https://example.com/a.zip');
    await expect(failed.info).rejects.toThrow('404');

    const retried = ZipFileStore.fromUrl('https://example.com/a.zip');
    expect(retried).not.toBe(failed);
  });

  it('Opens a new store after the cache is cleared', () => {
    const a = ZipFileStore.fromUrl('https://example.com/a.zip');
    ZipFileStore.clearCache();

    expect(ZipFileStore.fromUrl('https://example.com/a.zip')).not.toBe(a);
  });
});

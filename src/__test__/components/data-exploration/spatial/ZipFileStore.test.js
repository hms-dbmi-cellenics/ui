import { unzip } from 'unzipit';
import ZipFileStore from 'components/data-exploration/spatial/ZipFileStore';

jest.mock('unzipit', () => ({
  unzip: jest.fn(() => Promise.resolve({ entries: {} })),
}));

// whole-zip downloads go through fetch → blob before unzip
const mockFetchOk = () => jest.fn(async () => ({ ok: true, blob: async () => ({ size: 1 }) }));

describe('ZipFileStore.fromUrl', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ZipFileStore.clearCache();
    global.fetch = mockFetchOk();
    jest.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('Reuses the store (and its central directory) for the same url', async () => {
    const a = ZipFileStore.fromUrl('https://example.com/a.zip');
    const b = ZipFileStore.fromUrl('https://example.com/a.zip');
    const c = ZipFileStore.fromUrl('https://example.com/c.zip');
    await Promise.all([a.info, c.info]);

    expect(b).toBe(a);
    expect(c).not.toBe(a);
    expect(global.fetch).toHaveBeenCalledTimes(2);
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

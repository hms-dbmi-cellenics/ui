// Unit tests for the tile cache + global request scheduler. The actual decoders
// (readImageTile / readSegTile) are mocked so we can drive resolution timing and
// assert concurrency capping, superseded-request skipping, dedup and peek.

jest.mock('components/plots/getImageUrls', () => ({ readImageTile: jest.fn() }));
jest.mock('components/plots/loadSegmentationOverlay', () => ({
  readSegTile: jest.fn(),
  releaseOverlay: jest.fn(),
}));

const tick = () => new Promise((resolve) => { setTimeout(resolve, 0); });

const makeTile = (level, tx, ty) => ({
  level,
  tx,
  ty,
  x0: 0,
  x1: 1,
  y0: 0,
  y1: 1,
  extent: {
    xMin: 0, xMax: 1, yMin: 0, yMax: 1,
  },
});

const deferred = () => {
  let resolve;
  const promise = new Promise((r) => { resolve = r; });
  return { promise, resolve };
};

describe('spatialTileCache', () => {
  let loadTissueTile;
  let peekTissueTile;
  let readImageTile;
  let deferreds;

  beforeEach(() => {
    jest.resetModules();
    deferreds = [];
    // eslint-disable-next-line global-require
    readImageTile = require('components/plots/getImageUrls').readImageTile;
    readImageTile.mockReset();
    readImageTile.mockImplementation(() => {
      const d = deferred();
      deferreds.push(d);
      return d.promise;
    });
    // eslint-disable-next-line global-require
    const cache = require('components/plots/spatialTileCache');
    loadTissueTile = cache.loadTissueTile;
    peekTissueTile = cache.peekTissueTile;
  });

  const wanted = () => true;

  it('caps the number of tiles decoding concurrently (scheduler)', async () => {
    const pyramid = {};
    for (let i = 0; i < 10; i += 1) {
      loadTissueTile(pyramid, 'exp-s', makeTile(0, i, 0), { isWanted: wanted, priority: 1 });
    }
    await tick();
    // MAX_CONCURRENT_TILE_LOADS = 6 → only 6 decodes start, the rest queue
    expect(readImageTile).toHaveBeenCalledTimes(6);

    // completing one frees a slot → the 7th starts
    deferreds[0].resolve({ url: 'seg-overlay://1', extent: makeTile(0, 0, 0).extent });
    await tick();
    expect(readImageTile).toHaveBeenCalledTimes(7);
  });

  it('skips a request that is no longer wanted before it starts (no decode)', async () => {
    const promise = loadTissueTile({}, 'exp-s', makeTile(0, 0, 0), { isWanted: () => false });
    await expect(promise).resolves.toBeNull();
    expect(readImageTile).not.toHaveBeenCalled();
  });

  it('dedups concurrent requests for the same tile', async () => {
    const tile = makeTile(0, 1, 1);
    loadTissueTile({}, 'exp-s', tile, { isWanted: wanted });
    loadTissueTile({}, 'exp-s', tile, { isWanted: wanted });
    await tick();
    expect(readImageTile).toHaveBeenCalledTimes(1);
  });

  it('resolves + caches the tile for synchronous peek once decoded', async () => {
    const tile = makeTile(0, 2, 3);
    const result = { url: 'seg-overlay://9', extent: tile.extent };
    const promise = loadTissueTile({}, 'exp-s', tile, { isWanted: wanted });
    await tick();
    deferreds[0].resolve(result);
    await expect(promise).resolves.toBe(result);
    expect(peekTissueTile('exp-s', tile)).toBe(result);
  });

  it('does not cache a skipped request, so it can be re-requested later', async () => {
    const tile = makeTile(0, 5, 5);
    let want = false;
    await loadTissueTile({}, 'exp-s', tile, { isWanted: () => want });
    expect(peekTissueTile('exp-s', tile)).toBeNull();

    // now it's wanted → a fresh request actually decodes
    want = true;
    loadTissueTile({}, 'exp-s', tile, { isWanted: () => want });
    await tick();
    expect(readImageTile).toHaveBeenCalledTimes(1);
  });
});

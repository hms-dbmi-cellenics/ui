// Mock the heavy zarr/zip deps so openOmePyramid's caching can be exercised
// without touching real I/O. resolvePyramidRegion is pure and needs no mocks.
const mockOpen = jest.fn();
const mockFromUrl = jest.fn(() => ({ store: true }));

jest.mock('zarrita', () => ({
  root: jest.fn(() => ({ resolve: (path) => ({ path }) })),
  open: (...args) => mockOpen(...args),
}));

jest.mock('components/data-exploration/spatial/ZipFileStore', () => ({
  __esModule: true,
  default: { fromUrl: (...args) => mockFromUrl(...args) },
}));

// eslint-disable-next-line import/first
import { resolvePyramidRegion, openOmePyramid } from 'components/plots/zarrPyramid';

// Helper: build a fake `levels` array of { shape } where shape is [h, w] (or
// [c, h, w]); resolvePyramidRegion only reads the last two dims.
const makeLevels = (...dims) => dims.map((shape) => ({ shape }));

describe('resolvePyramidRegion', () => {
  // A 3-level pyramid over a 1000x800 (w x h) slide: full, half, quarter.
  const fullW = 1000;
  const fullH = 800;
  const levels = makeLevels([800, 1000], [400, 500], [200, 250]);

  it('returns null for an empty viewport (degenerate x or y window)', () => {
    expect(resolvePyramidRegion(levels, fullW, fullH, {
      xMin: 100, xMax: 100, yMin: 0, yMax: 800, outputWidth: 256, outputHeight: 256,
    })).toBeNull();

    expect(resolvePyramidRegion(levels, fullW, fullH, {
      xMin: 0, xMax: 1000, yMin: 500, yMax: 500, outputWidth: 256, outputHeight: 256,
    })).toBeNull();
  });

  it('clamps the viewport to the slide bounds', () => {
    const region = resolvePyramidRegion(levels, fullW, fullH, {
      xMin: -50, xMax: 5000, yMin: -10, yMax: 9999, outputWidth: 1, outputHeight: 1,
    });
    // extent is clamped to [0, fullW] / [0, fullH]
    expect(region.extent).toEqual({
      xMin: 0, xMax: 1000, yMin: 0, yMax: 800,
    });
  });

  it('picks the coarsest level that still satisfies the requested output size', () => {
    // Whole slide, small output (250x200 px) → coarsest level (index 2) suffices:
    // fracX*lw = 1*250 >= 250 and fracY*lh = 1*200 >= 200.
    const coarse = resolvePyramidRegion(levels, fullW, fullH, {
      xMin: 0, xMax: 1000, yMin: 0, yMax: 800, outputWidth: 250, outputHeight: 200,
    });
    expect(coarse.level).toBe(2);

    // Whole slide, larger output → only full-res level (0) qualifies.
    const fine = resolvePyramidRegion(levels, fullW, fullH, {
      xMin: 0, xMax: 1000, yMin: 0, yMax: 800, outputWidth: 600, outputHeight: 600,
    });
    expect(fine.level).toBe(0);
  });

  it('selects a finer level as the viewport fraction shrinks (zoom in)', () => {
    // A 10% wide/tall crop with a 256px output needs ~2560 px across the full
    // slide; only the full-res level (1000px) gets close, so it picks level 0.
    const zoomed = resolvePyramidRegion(levels, fullW, fullH, {
      xMin: 0, xMax: 100, yMin: 0, yMax: 80, outputWidth: 50, outputHeight: 50,
    });
    expect(zoomed.level).toBe(0);
  });

  it('flips the y window (zarr row 0 = top = high data-y)', () => {
    // Request the BOTTOM strip in data space (low y). After the y-flip the zarr
    // rows should come from the BOTTOM of the array (high row indices).
    const bottom = resolvePyramidRegion(levels, fullW, fullH, {
      xMin: 0, xMax: 1000, yMin: 0, yMax: 100, outputWidth: 1, outputHeight: 1,
    });
    // chosen level 2 (250x200). scaleY = 200/800 = 0.25.
    // y0 = floor((800 - 100) * 0.25) = floor(175) = 175
    // y1 = ceil((800 - 0) * 0.25)   = 200
    expect(bottom.level).toBe(2);
    expect(bottom.y0).toBe(175);
    expect(bottom.y1).toBe(200);

    // The complementary TOP strip (high data-y) maps to low zarr rows.
    const top = resolvePyramidRegion(levels, fullW, fullH, {
      xMin: 0, xMax: 1000, yMin: 700, yMax: 800, outputWidth: 1, outputHeight: 1,
    });
    expect(top.y0).toBe(0);
    expect(top.y1).toBe(25);
  });

  it('scales the x window into the chosen level grid', () => {
    const region = resolvePyramidRegion(levels, fullW, fullH, {
      xMin: 500, xMax: 1000, yMin: 0, yMax: 800, outputWidth: 1, outputHeight: 1,
    });
    // level 2: scaleX = 250/1000 = 0.25. x0 = floor(500*0.25)=125, x1=ceil(1000*0.25)=250.
    expect(region.x0).toBe(125);
    expect(region.x1).toBe(250);
    expect(region.regionW).toBe(125);
  });

  it('reports the chosen shape, ndim, and region dimensions', () => {
    const region = resolvePyramidRegion(levels, fullW, fullH, {
      xMin: 0, xMax: 1000, yMin: 0, yMax: 800, outputWidth: 250, outputHeight: 200,
    });
    expect(region.shape).toEqual([200, 250]);
    expect(region.ndim).toBe(2);
    expect(region.regionW).toBe(region.x1 - region.x0);
    expect(region.regionH).toBe(region.y1 - region.y0);
  });

  it('reads the trailing two dims when levels carry a channel axis', () => {
    const chLevels = makeLevels([3, 800, 1000], [3, 200, 250]);
    const region = resolvePyramidRegion(chLevels, fullW, fullH, {
      xMin: 0, xMax: 1000, yMin: 0, yMax: 800, outputWidth: 250, outputHeight: 200,
    });
    expect(region.level).toBe(1);
    expect(region.ndim).toBe(3);
    expect(region.shape).toEqual([3, 200, 250]);
  });
});

describe('openOmePyramid', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // open() is called once for the root group then once per dataset path.
    mockOpen.mockImplementation((node, { kind }) => {
      if (kind === 'group') {
        return Promise.resolve({
          attrs: {
            multiscales: [{ datasets: [{ path: '0' }, { path: '1' }], axes: [{ name: 'y' }, { name: 'x' }] }],
          },
        });
      }
      // array open
      return Promise.resolve({ shape: [600, 900] });
    });
  });

  it('opens the pyramid and exposes level shapes + full dimensions', async () => {
    const result = await openOmePyramid('https://example.com/unique-1.zarr.zip');

    expect(result.fullW).toBe(900);
    expect(result.fullH).toBe(600);
    expect(result.levels).toHaveLength(2);
    expect(result.axesMetadata).toEqual([{ name: 'y' }, { name: 'x' }]);
    expect(mockFromUrl).toHaveBeenCalledWith('https://example.com/unique-1.zarr.zip');
  });

  it('caches by URL: a second call for the same URL does not re-open the store', async () => {
    const url = 'https://example.com/unique-2.zarr.zip';
    const first = openOmePyramid(url);
    const second = openOmePyramid(url);

    // Same in-flight promise returned (cached) — store opened only once.
    expect(second).toBe(first);
    await first;
    expect(mockFromUrl).toHaveBeenCalledTimes(1);
  });

  it('uses distinct cache entries for distinct URLs', async () => {
    await openOmePyramid('https://example.com/a.zarr.zip');
    await openOmePyramid('https://example.com/b.zarr.zip');
    expect(mockFromUrl).toHaveBeenCalledTimes(2);
  });

  it('falls back to the default dataset path when multiscale metadata is missing', async () => {
    mockOpen.mockImplementation((node, { kind }) => {
      if (kind === 'group') return Promise.reject(new Error('no metadata'));
      return Promise.resolve({ shape: [120, 340] });
    });

    const result = await openOmePyramid('https://example.com/no-meta.zarr.zip');
    expect(result.levels).toHaveLength(1);
    expect(result.fullW).toBe(340);
    expect(result.fullH).toBe(120);
    expect(result.axesMetadata).toBeNull();
  });

  it('evicts the cache entry when opening rejects so a retry can re-open', async () => {
    const url = 'https://example.com/fails-then-succeeds.zarr.zip';

    // First attempt: group open is fine (gives the dataset list) but the array
    // open hard-fails, so the whole open rejects.
    mockOpen.mockImplementation((node, { kind }) => {
      if (kind === 'group') {
        return Promise.resolve({ attrs: { multiscales: [{ datasets: [{ path: '0' }] }] } });
      }
      return Promise.reject(new Error('array fail'));
    });

    await expect(openOmePyramid(url)).rejects.toThrow('array fail');

    // Cache entry was deleted on rejection, so a retry re-opens the store.
    mockOpen.mockImplementation((node, { kind }) => {
      if (kind === 'group') {
        return Promise.resolve({ attrs: { multiscales: [{ datasets: [{ path: '0' }] }] } });
      }
      return Promise.resolve({ shape: [10, 20] });
    });

    const retry = await openOmePyramid(url);
    expect(retry.fullW).toBe(20);
    expect(retry.fullH).toBe(10);
    expect(mockFromUrl).toHaveBeenCalledTimes(2);
  });
});

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
import {
  resolvePyramidRegion, openOmePyramid, pickLevel, tilesForViewport,
} from 'components/plots/zarrPyramid';

// Helper: build a fake `levels` array of { shape } where shape is [h, w] (or
// [c, h, w]); resolvePyramidRegion only reads the last two dims.
const makeLevels = (...dims) => dims.map((shape) => ({ shape }));

describe('pickLevel', () => {
  const fullW = 1000;
  const fullH = 800;
  // full, half, quarter
  const levels = makeLevels([800, 1000], [400, 500], [200, 250]);

  it('picks the coarsest level for the full slide at a small output', () => {
    expect(pickLevel(levels, fullW, fullH, {
      xMin: 0, xMax: 1000, yMin: 0, yMax: 800, outputWidth: 200, outputHeight: 200,
    })).toBe(2);
  });

  it('picks a finer level as the viewport shrinks (zoom in)', () => {
    // a small viewport still needs >= output px → finest level
    const lvl = pickLevel(levels, fullW, fullH, {
      xMin: 0, xMax: 100, yMin: 0, yMax: 80, outputWidth: 256, outputHeight: 256,
    });
    expect(lvl).toBe(0);
  });

  it('falls back to full resolution when no level satisfies the output size', () => {
    expect(pickLevel(levels, fullW, fullH, {
      xMin: 0, xMax: 1000, yMin: 0, yMax: 800, outputWidth: 5000, outputHeight: 5000,
    })).toBe(0);
  });
});

describe('tilesForViewport', () => {
  const fullW = 1000;
  const fullH = 800;
  const levels = makeLevels([800, 1000], [400, 500], [200, 250]);

  it('tiles the full extent at the coarsest level and covers it with 1px overlap', () => {
    const tiles = tilesForViewport(levels, fullW, fullH, 2, {
      xMin: 0, xMax: 1000, yMin: 0, yMax: 800,
    }, 512);
    // level 2 is 250x200 → a single 512 tile covers it
    expect(tiles).toHaveLength(1);
    const [t] = tiles;
    expect(t.extent.xMin).toBeCloseTo(0);
    expect(t.extent.xMax).toBeCloseTo(1000);
    expect(t.extent.yMin).toBeCloseTo(0);
    expect(t.extent.yMax).toBeCloseTo(800);
  });

  it('returns multiple tiles that meet exactly (no gap/overlap) at a finer level', () => {
    // level 0 is 1000x800; with tileSize 256 → ceil(1000/256)=4 cols, ceil(800/256)=4 rows
    const tiles = tilesForViewport(levels, fullW, fullH, 0, {
      xMin: 0, xMax: 1000, yMin: 0, yMax: 800,
    }, 256);
    expect(tiles.length).toBe(16);

    // adjacent tiles share their edge exactly in data space; the on-screen seam is
    // removed by rounding the mark edges to integer pixels in the Vega spec
    const byCoord = (tx, ty) => tiles.find((t) => t.tx === tx && t.ty === ty);
    const left = byCoord(0, 0);
    const right = byCoord(1, 0);
    expect(left.extent.xMax).toBeCloseTo(right.extent.xMin);
  });

  it('returns no tiles for an empty viewport', () => {
    expect(tilesForViewport(levels, fullW, fullH, 0, {
      xMin: 500, xMax: 500, yMin: 0, yMax: 800,
    }, 256)).toHaveLength(0);
  });

  it('only returns tiles intersecting a sub-region viewport', () => {
    const all = tilesForViewport(levels, fullW, fullH, 0, {
      xMin: 0, xMax: 1000, yMin: 0, yMax: 800,
    }, 256);
    const sub = tilesForViewport(levels, fullW, fullH, 0, {
      xMin: 0, xMax: 200, yMin: 600, yMax: 800,
    }, 256);
    expect(sub.length).toBeLessThan(all.length);
    expect(sub.length).toBeGreaterThan(0);
  });
});

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

describe('per-level coordinate frame (cross-level registration)', () => {
  // When a level's dimensions are a ROUNDED (not exact) divisor of the full size,
  // the shape ratio (lw/fullW) disagrees with the true downsample factor, so coarse
  // and fine tiles land at slightly different data coords. The OME-Zarr scale
  // transforms give the exact factor, keeping every level on one coordinate frame.
  const fullW = 999;
  const fullH = 801;
  // level 0: 999x801 (scale 1); level 1: ceil-rounded 500x401 but TRUE factor is 2.
  const withTransforms = [
    {
      shape: [801, 999], pxPerFullX: 1, pxPerFullY: 1, offsetFullX: 0, offsetFullY: 0,
    },
    {
      shape: [401, 500], pxPerFullX: 0.5, pxPerFullY: 0.5, offsetFullX: 0, offsetFullY: 0,
    },
  ];

  it('uses the exact downsample factor, not the rounded shape ratio', () => {
    // A level-1 tile spanning [0, 500) level-px should cover [0, 1000) full-px (factor
    // 2), NOT [0, 500/500*999] = [0, 999] that the shape ratio would give.
    const tiles = tilesForViewport(withTransforms, fullW, fullH, 1, {
      xMin: 0, xMax: fullW, yMin: 0, yMax: fullH,
    }, 512);
    expect(tiles).toHaveLength(1);
    // x1 = 500 level-px / 0.5 = 1000 full-px (exact factor), clamped only by the viewport
    expect(tiles[0].extent.xMin).toBeCloseTo(0);
    expect(tiles[0].extent.xMax).toBeCloseTo(1000);
  });

  it('keeps a level-1 window aligned to the exact factor in resolvePyramidRegion', () => {
    const region = resolvePyramidRegion(withTransforms, fullW, fullH, {
      xMin: 400, xMax: 600, yMin: 0, yMax: fullH, outputWidth: 1, outputHeight: 1,
    });
    expect(region.level).toBe(1);
    // x0 = floor((400 - 0) * 0.5) = 200, x1 = ceil(600 * 0.5) = 300 — exact halves,
    // independent of the rounded 500-px width.
    expect(region.x0).toBe(200);
    expect(region.x1).toBe(300);
  });

  it('honours a per-level translation offset', () => {
    // A level shifted by +4 full-px: level-px p maps to full-px p/0.5 + 4.
    const shifted = [
      {
        shape: [801, 999], pxPerFullX: 1, pxPerFullY: 1, offsetFullX: 0, offsetFullY: 0,
      },
      {
        shape: [401, 500], pxPerFullX: 0.5, pxPerFullY: 0.5, offsetFullX: 4, offsetFullY: 0,
      },
    ];
    const tiles = tilesForViewport(shifted, fullW, fullH, 1, {
      xMin: 0, xMax: fullW, yMin: 0, yMax: fullH,
    }, 512);
    // x0 = floor((0 - 4) * 0.5) clamped to 0 → 0; extent.xMin = 0/0.5 + 4 = 4
    expect(tiles[0].extent.xMin).toBeCloseTo(4);
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

  it('derives per-level affine maps from coordinateTransformations', async () => {
    mockOpen.mockImplementation((node, { kind }) => {
      if (kind === 'group') {
        return Promise.resolve({
          attrs: {
            multiscales: [{
              axes: [{ name: 'y' }, { name: 'x' }],
              datasets: [
                { path: '0', coordinateTransformations: [{ type: 'scale', scale: [1, 1] }] },
                {
                  path: '1',
                  coordinateTransformations: [
                    { type: 'scale', scale: [2, 2] },
                    { type: 'translation', translation: [0.5, 0.5] },
                  ],
                },
              ],
            }],
          },
        });
      }
      // level 0 = 600x900, level 1 = 300x450
      return Promise.resolve({ shape: node.path === '1' ? [300, 450] : [600, 900] });
    });

    const result = await openOmePyramid('https://example.com/transforms.zarr.zip');
    const [lvl0, lvl1] = result.levels;
    // level 0: identity
    expect(lvl0.pxPerFullX).toBeCloseTo(1);
    expect(lvl0.offsetFullX).toBeCloseTo(0);
    // level 1: scale 2 (s0/sL = 1/2) and translation 0.5 / s0 = 0.5 full-px
    expect(lvl1.pxPerFullX).toBeCloseTo(0.5);
    expect(lvl1.pxPerFullY).toBeCloseTo(0.5);
    expect(lvl1.offsetFullX).toBeCloseTo(0.5);
    expect(lvl1.offsetFullY).toBeCloseTo(0.5);
  });

  it('infers exact integer factors from shapes for v0.3 pyramids (no transforms)', async () => {
    // v0.3: datasets carry NO coordinateTransformations. Our writer uses
    // scale_factors [2,4,8,16]; with a non-divisible full width the level dims are
    // floor-rounded, so the raw fullW/levelW ratio drifts off the true 2^L. The
    // inference must recover EXACTLY 1, 1/2, 1/4, 1/8, 1/16.
    const dims = {
      0: [801, 999], 1: [401, 500], 2: [200, 250], 3: [100, 125], 4: [50, 62],
    };
    mockOpen.mockImplementation((node, { kind }) => {
      if (kind === 'group') {
        return Promise.resolve({
          attrs: {
            multiscales: [{
              axes: [{ name: 'y' }, { name: 'x' }],
              datasets: [0, 1, 2, 3, 4].map((p) => ({ path: String(p) })),
            }],
          },
        });
      }
      return Promise.resolve({ shape: dims[node.path] });
    });

    const result = await openOmePyramid('https://example.com/v03.zarr.zip');
    const pxX = result.levels.map((l) => l.pxPerFullX);
    const pxY = result.levels.map((l) => l.pxPerFullY);
    expect(pxX).toEqual([1, 1 / 2, 1 / 4, 1 / 8, 1 / 16]);
    expect(pxY).toEqual([1, 1 / 2, 1 / 4, 1 / 8, 1 / 16]);
    // offsets are 0 — skimage centre-aligned resize needs no half-pixel term
    expect(result.levels.every((l) => l.offsetFullX === 0 && l.offsetFullY === 0)).toBe(true);

    // ...and the raw shape ratio would have been WRONG at the coarsest level:
    // 999/62 = 16.11 ≠ 16, the few-pixel drift that displaced the coarse overlay.
    expect(999 / 62).not.toBeCloseTo(16, 1);
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

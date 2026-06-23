import { tableFromArrays, tableToIPC } from 'apache-arrow';
import loadMoleculeNodes, {
  loadMoleculeMeta,
  buildMoleculeColorLookup,
} from 'utils/spatial/loadMoleculeNodes';

// Build a Feather (Arrow IPC file) buffer for a tile/manifest table.
const feather = (cols) => tableToIPC(tableFromArrays(cols), 'file');

const extentJson = (xmin, ymin, xmax, ymax) => JSON.stringify({ x: [xmin, xmax], y: [ymin, ymax] });

// meta.json mirrors the contract: dense genes array indexed by feature_code.
const META = {
  version: 1,
  qvThreshold: 20,
  rootExtent: { x: [0, 10], y: [0, 10] },
  maxDepth: 1,
  tileSize: 65536,
  firstTileSize: 65536,
  pointColumns: ['x', 'y', 'feature_code'],
  genes: [
    { code: 0, gene: 'Gad1', color: '#1f77b4' },
    { code: 1, gene: 'Sst', color: '#ff7f0e' },
    { code: 2, gene: 'Pvalb', color: '#2ca02c' },
  ],
};

// A 2-level pyramid:
//   root 0/0/0 covers [0,10]x[0,10], 2 points (one of each in left/right half)
//   1/0/0 covers the lower-left quadrant [0,5]x[0,5] with 2 points
//   1/1/1 covers the upper-right quadrant [5,10]x[5,10] with 1 point
const buildStore = (overrides = {}) => {
  const entries = {
    'meta.json': new TextEncoder().encode(JSON.stringify(META)),
    'manifest.feather': feather({
      key: ['0/0/0', '1/0/0', '1/1/1'],
      nPoints: Int32Array.from([2, 2, 1]),
      extent: [
        extentJson(0, 0, 10, 10),
        extentJson(0, 0, 5, 5),
        extentJson(5, 5, 10, 10),
      ],
    }),
    '0/0/0.feather': feather({
      x: Float64Array.from([2, 8]),
      y: Float64Array.from([2, 8]),
      feature_code: Int32Array.from([0, 1]),
    }),
    '1/0/0.feather': feather({
      x: Float64Array.from([1, 3]),
      y: Float64Array.from([1, 3]),
      feature_code: Int32Array.from([0, 2]),
    }),
    '1/1/1.feather': feather({
      x: Float64Array.from([9]),
      y: Float64Array.from([9]),
      feature_code: Int32Array.from([1]),
    }),
    ...overrides,
  };

  const get = jest.fn(async (key) => entries[key.replace(/^\//, '')]);
  return { get, entries, getMock: get };
};

describe('loadMoleculeNodes', () => {
  it('caches manifest + meta.json per store (read once)', async () => {
    const store = buildStore();
    await loadMoleculeNodes(store, { bbox: [0, 0, 10, 10], depth: 0 });
    await loadMoleculeNodes(store, { bbox: [0, 0, 10, 10], depth: 0 });

    const manifestReads = store.getMock.mock.calls.filter(([k]) => k.includes('manifest.feather'));
    const metaReads = store.getMock.mock.calls.filter(([k]) => k.includes('meta.json'));
    expect(manifestReads).toHaveLength(1);
    expect(metaReads).toHaveLength(1);
  });

  it('returns only the root overview at depth 0', async () => {
    const store = buildStore();
    const {
      x, y, featureCode, count,
    } = await loadMoleculeNodes(store, {
      bbox: [0, 0, 10, 10], depth: 0,
    });
    expect(count).toBe(2);
    expect(Array.from(x)).toEqual([2, 8]);
    expect(Array.from(y)).toEqual([2, 8]);
    expect(Array.from(featureCode)).toEqual([0, 1]);
  });

  it('adds detail tiles at deeper depths (additive LOD: ancestors included)', async () => {
    const store = buildStore();
    const { count } = await loadMoleculeNodes(store, { bbox: [0, 0, 10, 10], depth: 1 });
    // root (2) + 1/0/0 (2) + 1/1/1 (1) = 5
    expect(count).toBe(5);
  });

  it('selects only tiles whose extent intersects the bbox', async () => {
    const store = buildStore();
    // a bbox in the lower-left quadrant only: root + 1/0/0, not 1/1/1
    const { count } = await loadMoleculeNodes(store, { bbox: [0, 0, 4, 4], depth: 1 });
    expect(count).toBe(4);
    // the upper-right tile must never be read
    const upperRightReads = store.getMock.mock.calls.filter(([k]) => k.includes('1/1/1'));
    expect(upperRightReads).toHaveLength(0);
  });

  it('clamps depth to the manifest maxDepth', async () => {
    const store = buildStore();
    const { count } = await loadMoleculeNodes(store, { bbox: [0, 0, 10, 10], depth: 99 });
    expect(count).toBe(5);
  });

  it('picks depth by the maxPoints budget when depth is omitted', async () => {
    const store = buildStore();
    // budget below the cost of going to depth 1 (2 + 3 = 5) keeps just the root
    const shallow = await loadMoleculeNodes(store, { bbox: [0, 0, 10, 10], maxPoints: 4 });
    expect(shallow.count).toBe(2);
    // a generous budget reaches depth 1
    const deep = await loadMoleculeNodes(store, { bbox: [0, 0, 10, 10], maxPoints: 100 });
    expect(deep.count).toBe(5);
  });

  it('filters rows by the requested gene feature_codes', async () => {
    const store = buildStore();
    // gene code 0 only: root has one (x=2), 1/0/0 has one (x=1), 1/1/1 none
    const { count, featureCode } = await loadMoleculeNodes(store, {
      bbox: [0, 0, 10, 10], depth: 1, genes: [0],
    });
    expect(count).toBe(2);
    expect(Array.from(featureCode)).toEqual([0, 0]);
  });

  it('drops non-finite coordinates (Phase-1 guard)', async () => {
    const store = buildStore({
      '0/0/0.feather': feather({
        x: Float64Array.from([2, NaN]),
        y: Float64Array.from([2, 8]),
        feature_code: Int32Array.from([0, 1]),
      }),
    });
    const { count, x } = await loadMoleculeNodes(store, { bbox: [0, 0, 10, 10], depth: 0 });
    expect(count).toBe(1);
    expect(Array.from(x)).toEqual([2]);
  });

  it('throws without a valid bbox', async () => {
    const store = buildStore();
    await expect(loadMoleculeNodes(store, { depth: 0 })).rejects.toThrow(/bbox/);
  });

  describe('maxRenderedPoints (budget by filtered count)', () => {
    it('accumulates root→deeper until enough gene-filtered points, then stops', async () => {
      const store = buildStore();
      // Gad1 (code 0) appears in the root (2,2) and in 1/0/0 (1,1) → 2 rendered pts.
      const res = await loadMoleculeNodes(store, {
        bbox: [0, 0, 10, 10], genes: [0], maxRenderedPoints: 100,
      });
      expect(res.count).toBe(2);
      expect(Array.from(res.featureCode)).toEqual([0, 0]);
    });

    it('stops reading deeper tiles once the rendered budget is met (no over-read)', async () => {
      const store = buildStore();
      // budget 1: the root already yields 1 Gad1 point → depth-1 tiles never read.
      const res = await loadMoleculeNodes(store, {
        bbox: [0, 0, 10, 10], genes: [0], maxRenderedPoints: 1,
      });
      expect(res.count).toBe(1);
      expect(store.getMock).toHaveBeenCalledWith('/0/0/0.feather');
      expect(store.getMock).not.toHaveBeenCalledWith('/1/0/0.feather');
    });

    it('honours the raw-read cap for a sparse/absent gene instead of scanning all', async () => {
      const store = buildStore();
      // code 2 (Pvalb) is only in 1/0/0; with a tiny raw cap we stop after the root
      // (2 raw read >= cap) without ever reading the deeper tiles.
      const res = await loadMoleculeNodes(store, {
        bbox: [0, 0, 10, 10], genes: [2], maxRenderedPoints: 100, maxRawPoints: 1,
      });
      expect(res.count).toBe(0);
      expect(store.getMock).not.toHaveBeenCalledWith('/1/0/0.feather');
    });
  });
});

describe('loadMoleculeMeta', () => {
  it('returns the parsed meta dictionary', async () => {
    const store = buildStore();
    const meta = await loadMoleculeMeta(store);
    expect(meta.genes).toHaveLength(3);
    expect(meta.genes[1].gene).toBe('Sst');
  });
});

describe('buildMoleculeColorLookup', () => {
  it('maps a feature_code to its baked RGBA colour', () => {
    const lookup = buildMoleculeColorLookup(META);
    expect(lookup(0)).toEqual([31, 119, 180, 255]); // #1f77b4
    expect(lookup(1)).toEqual([255, 127, 14, 255]); // #ff7f0e
  });

  it('falls back to grey for an unknown code', () => {
    const lookup = buildMoleculeColorLookup(META);
    expect(lookup(99)).toEqual([128, 128, 128, 255]);
  });

  it('accepts a bare genes array as well as a full meta object', () => {
    const lookup = buildMoleculeColorLookup(META.genes);
    expect(lookup(2)).toEqual([44, 160, 44, 255]); // #2ca02c
  });
});

import {
  tableFromArrays, tableToIPC, compressionRegistry, CompressionType,
} from 'apache-arrow';
import loadMoleculeNodes, {
  loadMoleculeMeta,
  buildMoleculeColorLookup,
} from 'utils/spatial/loadMoleculeNodes';
import { MOLECULE_PALETTE } from 'utils/spatial/moleculeColors';
import parseColor from 'components/data-exploration/parseColor';

// Build a Feather (Arrow IPC file) buffer for a per-gene table.
const feather = (cols) => tableToIPC(tableFromArrays(cols), 'file');

// meta.json mirrors the contract: dense genes array indexed by feature_code, each
// entry naming its own per-gene Feather file.
const META = {
  version: 2,
  qvThreshold: 20,
  rootExtent: { x: [0, 10], y: [0, 10] },
  genes: [
    { code: 0, gene: 'Gad1', entry: '0.feather', nPoints: 2 },
    { code: 1, gene: 'Sst', entry: '1.feather', nPoints: 2 },
    { code: 2, gene: 'Pvalb', entry: '2.feather', nPoints: 1 },
  ],
};

// One Feather entry per gene: x/y only (the entry IS the gene).
const buildStore = (overrides = {}) => {
  const entries = {
    'meta.json': new TextEncoder().encode(JSON.stringify(META)),
    '0.feather': feather({
      x: Float64Array.from([2, 1]),
      y: Float64Array.from([2, 1]),
    }),
    '1.feather': feather({
      x: Float64Array.from([8, 9]),
      y: Float64Array.from([8, 9]),
    }),
    '2.feather': feather({
      x: Float64Array.from([3]),
      y: Float64Array.from([3]),
    }),
    ...overrides,
  };

  const get = jest.fn(async (key) => entries[key.replace(/^\//, '')]);
  return { get, entries, getMock: get };
};

describe('loadMoleculeNodes', () => {
  it('caches meta.json per store (read once)', async () => {
    const store = buildStore();
    await loadMoleculeNodes(store, { genes: [0] });
    await loadMoleculeNodes(store, { genes: [0] });

    const metaReads = store.getMock.mock.calls.filter(([k]) => k.includes('meta.json'));
    expect(metaReads).toHaveLength(1);
  });

  it('reads only the requested gene entries, never the others', async () => {
    const store = buildStore();
    const {
      x, y, featureCode, count,
    } = await loadMoleculeNodes(store, { genes: [0] });

    expect(count).toBe(2);
    expect(Array.from(x)).toEqual([2, 1]);
    expect(Array.from(y)).toEqual([2, 1]);
    expect(Array.from(featureCode)).toEqual([0, 0]);

    // the other genes' entries must never be range-read
    expect(store.getMock).toHaveBeenCalledWith('/0.feather');
    expect(store.getMock).not.toHaveBeenCalledWith('/1.feather');
    expect(store.getMock).not.toHaveBeenCalledWith('/2.feather');
  });

  it('concatenates multiple genes, tagging each point with its feature_code', async () => {
    const store = buildStore();
    const { count, featureCode } = await loadMoleculeNodes(store, { genes: [0, 1] });
    expect(count).toBe(4);
    expect(Array.from(featureCode)).toEqual([0, 0, 1, 1]);
  });

  it('loads every gene when none are requested', async () => {
    const store = buildStore();
    const { count } = await loadMoleculeNodes(store, {});
    // 2 (Gad1) + 2 (Sst) + 1 (Pvalb)
    expect(count).toBe(5);
  });

  it('ignores requested codes absent from the dictionary', async () => {
    const store = buildStore();
    const { count } = await loadMoleculeNodes(store, { genes: [0, 99] });
    expect(count).toBe(2);
  });

  it('caches a parsed gene entry (re-selecting it does not re-read)', async () => {
    const store = buildStore();
    await loadMoleculeNodes(store, { genes: [0] });
    await loadMoleculeNodes(store, { genes: [0] });
    const geneReads = store.getMock.mock.calls.filter(([k]) => k.includes('0.feather'));
    expect(geneReads).toHaveLength(1);
  });

  it('drops non-finite coordinates (Phase-1 guard)', async () => {
    const store = buildStore({
      '0.feather': feather({
        x: Float64Array.from([2, NaN]),
        y: Float64Array.from([2, 8]),
      }),
    });
    const { count, x } = await loadMoleculeNodes(store, { genes: [0] });
    expect(count).toBe(1);
    expect(Array.from(x)).toEqual([2]);
  });
});

describe('ZSTD codec registration', () => {
  it('registers a ZSTD decoder when the reader module loads', () => {
    // importing loadMoleculeNodes (top of file) pulls in registerArrowZstd
    const codec = compressionRegistry.get(CompressionType.ZSTD);
    expect(codec).toBeTruthy();
    expect(typeof codec.decode).toBe('function');
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
  it('maps a feature_code to its Polychrome RGBA colour', () => {
    const lookup = buildMoleculeColorLookup();
    expect(lookup(0)).toEqual(parseColor(MOLECULE_PALETTE[0]));
    expect(lookup(1)).toEqual(parseColor(MOLECULE_PALETTE[1]));
  });

  it('cycles the palette for codes beyond its length', () => {
    const lookup = buildMoleculeColorLookup();
    // code == palette length wraps back to palette[0]
    expect(lookup(MOLECULE_PALETTE.length)).toEqual(lookup(0));
  });

  it('falls back to grey for a non-integer code', () => {
    const lookup = buildMoleculeColorLookup();
    expect(lookup(undefined)).toEqual([128, 128, 128, 255]);
  });
});

import { tableFromIPC } from 'apache-arrow';
// Registers the ZSTD decoder so the per-gene tiles (ZSTD-compressed Arrow bodies)
// can be parsed; side-effect import, must load before any tile is read.
import './registerArrowZstd';

/**
 * Shared molecule reader for Xenium transcript overlays.
 *
 * Reads the `molecules.bygene.zip` artifact (one Feather entry PER GENE + our
 * meta.json dictionary) over HTTP byte-ranges via the existing ZipFileStore
 * pattern, and returns the molecule points for the requested genes as flat typed
 * arrays.
 *
 * This is the SINGLE piece of code shared by the deck.gl SpatialViewer overlay and
 * the Vega Plots & Tables spatial plot. See phase3-molecule-format-contract.md for the
 * binding format contract.
 *
 * The artifact is GENE-PARTITIONED: each gene's molecules live in their own
 * `{feature_code}.feather` entry, so reading a few genes range-reads ONLY those
 * entries (no spatial quadtree, no LOD, no scanning/discarding other genes). We
 * only ever render a few genes at a time, and deck.gl renders that point count
 * directly, so there is no level-of-detail step.
 *
 * Coordinates are in MICRONS, the same frame as the centroids/segmentation
 * polygons (no y-flip in the deck.gl viewer — callers apply the same
 * offsetCentroids grid translation molecules share with the cells).
 */

// Per-store cache of the parsed meta.json (the gene dictionary), keyed by the
// store instance. Each artifact zip is opened once and its meta parsed once.
const storeCache = new WeakMap();

const ZIP_KEY_PREFIX = '/'; // ZipFileStore.get strips a single leading slash

const getEntry = async (store, key) => {
  const bytes = await store.get(`${ZIP_KEY_PREFIX}${key}`);
  if (!bytes) throw new Error(`molecules artifact: missing entry "${key}"`);
  return bytes;
};

// Per-store cache of PARSED per-gene typed-arrays, keyed by entry name, so
// re-selecting a gene (or re-rendering) doesn't re-range-read + re-`toArray()` it.
// Bounded FIFO — a panel has hundreds of genes but only a handful are ever loaded.
const GENE_CACHE_LIMIT = 64;
const geneCache = new WeakMap(); // store -> Map(entry -> { xs, ys, n })

const readGeneEntry = async (store, entry) => {
  let perStore = geneCache.get(store);
  if (!perStore) { perStore = new Map(); geneCache.set(store, perStore); }
  if (perStore.has(entry)) return perStore.get(entry);

  const bytes = await getEntry(store, entry);
  const table = tableFromIPC(bytes);
  const parsed = {
    xs: table.getChild('x').toArray(),
    ys: table.getChild('y').toArray(),
    n: table.numRows,
  };

  if (perStore.size >= GENE_CACHE_LIMIT) {
    perStore.delete(perStore.keys().next().value); // evict oldest (FIFO)
  }
  perStore.set(entry, parsed);
  return parsed;
};

/**
 * Load + cache meta.json for a store (the gene dictionary + build metadata).
 * @returns {Promise<object>} the parsed meta.json
 */
const loadMeta = async (store) => {
  if (storeCache.has(store)) return storeCache.get(store);

  const promise = (async () => {
    const metaBytes = await getEntry(store, 'meta.json');
    return JSON.parse(new TextDecoder().decode(metaBytes));
  })();

  storeCache.set(store, promise);
  return promise;
};

/**
 * Read the molecule points for a set of genes.
 *
 * @param {object} store ZipFileStore opened on the molecules.bygene.zip
 * @param {object} opts
 * @param {number[]} [opts.genes] feature_codes to load; omit for ALL genes
 * @returns {Promise<{ x: Float32Array, y: Float32Array, featureCode: Int32Array, count: number }>}
 */
const loadMoleculeNodes = async (store, { genes } = {}) => {
  const meta = await loadMeta(store);
  const dict = meta.genes ?? [];

  // code -> entry filename (the contract bakes `entry` per gene; default to
  // `${code}.feather` for resilience to an older artifact that omits it).
  const entryByCode = new Map(dict.map((g) => [g.code, g.entry ?? `${g.code}.feather`]));

  // Which genes to load: the requested codes (that exist in the dictionary), or
  // every gene when none are requested.
  const codes = Array.isArray(genes) && genes.length
    ? genes.filter((code) => entryByCode.has(code))
    : dict.map((g) => g.code);

  // Range-read + parse each gene's entry (cached), in parallel.
  const chunks = await Promise.all(codes.map(async (code) => {
    const { xs, ys, n } = await readGeneEntry(store, entryByCode.get(code));
    return {
      code, xs, ys, n,
    };
  }));

  // A row survives if both coordinates are finite (Phase-1 guard). The gene is the
  // entry, so every surviving row carries that entry's feature_code.
  let total = 0;
  chunks.forEach(({ xs, ys, n }) => {
    for (let i = 0; i < n; i += 1) {
      if (Number.isFinite(xs[i]) && Number.isFinite(ys[i])) total += 1;
    }
  });

  const x = new Float32Array(total);
  const y = new Float32Array(total);
  const featureCode = new Int32Array(total);

  let w = 0;
  chunks.forEach(({
    code, xs, ys, n,
  }) => {
    for (let i = 0; i < n; i += 1) {
      if (Number.isFinite(xs[i]) && Number.isFinite(ys[i])) {
        x[w] = xs[i];
        y[w] = ys[i];
        featureCode[w] = code;
        w += 1;
      }
    }
  });

  return {
    x, y, featureCode, count: total,
  };
};

/**
 * Load the meta dictionary (genes/colors + build metadata) for a artifact store.
 * Cached per store.
 * @returns {Promise<object>} the parsed meta.json
 */
const loadMoleculeMeta = async (store) => loadMeta(store);

export default loadMoleculeNodes;
export {
  loadMoleculeMeta,
};

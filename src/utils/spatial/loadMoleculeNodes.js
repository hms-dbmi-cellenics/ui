import { tableFromIPC } from 'apache-arrow';
import parseColor from 'components/data-exploration/parseColor';

/**
 * Shared molecule-pyramid reader for Xenium transcript overlays.
 *
 * Reads the `molecules.pyramid.zip` artifact (quadfeather tile tree + our
 * meta.json) over HTTP byte-ranges via the existing ZipFileStore pattern, and
 * returns the molecule points intersecting a query bbox as flat typed arrays.
 *
 * This is the SINGLE piece of code shared by the deck.gl SpatialViewer (cartesian
 * TileLayer) and the Vega Plots & Tables spatial plot. See
 * phase3-pyramid-contract.md for the binding format contract.
 *
 * The pyramid uses an ADDITIVE level-of-detail model: each molecule lives in
 * exactly one tile, the root (0/0/0) is a coarse overview, and deeper tiles add
 * detail. Rendering a viewport at depth d = the union of all tiles from the root
 * down to depth d whose extent intersects the viewport.
 *
 * Coordinates are in MICRONS, the same frame as the centroids/segmentation
 * polygons (no y-flip in the deck.gl viewer — callers apply the same
 * offsetCentroids grid translation molecules share with the cells).
 */

// Per-store cache of the manifest (node index) + meta.json, keyed by the store
// instance. Each pyramid zip is opened once and its index parsed once.
const storeCache = new WeakMap();

const ZIP_KEY_PREFIX = '/'; // ZipFileStore.get strips a single leading slash

/**
 * Parse the JSON `extent` column of a manifest row into a numeric bbox.
 * @returns {[number, number, number, number]} [xmin, ymin, xmax, ymax]
 */
const parseExtent = (extentJson) => {
  const { x, y } = JSON.parse(extentJson);
  return [x[0], y[0], x[1], y[1]];
};

const tileDepth = (key) => parseInt(key.split('/')[0], 10);

// Two axis-aligned bboxes [xmin,ymin,xmax,ymax] intersect when they overlap on
// both axes. Non-finite coordinates never intersect (Phase-1 learning 2 guard).
const bboxesIntersect = (a, b) => {
  if (a.some((v) => !Number.isFinite(v)) || b.some((v) => !Number.isFinite(v))) return false;
  return a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1];
};

const getEntry = async (store, key) => {
  const bytes = await store.get(`${ZIP_KEY_PREFIX}${key}`);
  if (!bytes) throw new Error(`molecules pyramid: missing entry "${key}"`);
  return bytes;
};

// Per-store cache of PARSED tile typed-arrays, so zoom/pan (which revisits the same
// tiles) doesn't re-range-read + re-`toArray()` them. Bounded FIFO so a session that
// pans across a large pyramid can't grow it without limit.
const TILE_CACHE_LIMIT = 512;
const tileCache = new WeakMap(); // store -> Map(tileKey -> { xs, ys, codes, n })

const readTileParsed = async (store, key) => {
  let perStore = tileCache.get(store);
  if (!perStore) { perStore = new Map(); tileCache.set(store, perStore); }
  if (perStore.has(key)) return perStore.get(key);

  const tileBytes = await getEntry(store, `${key}.feather`);
  const table = tableFromIPC(tileBytes);
  const parsed = {
    xs: table.getChild('x').toArray(),
    ys: table.getChild('y').toArray(),
    codes: table.getChild('feature_code').toArray(),
    n: table.numRows,
  };

  if (perStore.size >= TILE_CACHE_LIMIT) {
    perStore.delete(perStore.keys().next().value); // evict oldest (FIFO)
  }
  perStore.set(key, parsed);
  return parsed;
};

/**
 * Load + cache the manifest (node index) and meta.json for a store.
 *
 * @returns {Promise<{
 *   meta: object,
 *   nodes: Array<{ key: string, depth: number, nPoints: number, extent: number[] }>,
 * }>}
 */
const loadIndex = async (store) => {
  if (storeCache.has(store)) return storeCache.get(store);

  const promise = (async () => {
    const [manifestBytes, metaBytes] = await Promise.all([
      getEntry(store, 'manifest.feather'),
      getEntry(store, 'meta.json'),
    ]);

    const meta = JSON.parse(new TextDecoder().decode(metaBytes));

    const manifest = tableFromIPC(manifestBytes);
    const keyCol = manifest.getChild('key');
    const nPointsCol = manifest.getChild('nPoints');
    const extentCol = manifest.getChild('extent');

    const nodes = [];
    for (let i = 0; i < manifest.numRows; i += 1) {
      const key = String(keyCol.get(i));
      nodes.push({
        key,
        depth: tileDepth(key),
        nPoints: Number(nPointsCol.get(i)),
        extent: parseExtent(String(extentCol.get(i))),
      });
    }

    return { meta, nodes };
  })();

  storeCache.set(store, promise);
  return promise;
};

/**
 * Choose the deepest depth whose cumulative nPoints (over bbox-intersecting
 * tiles, ancestors included) stays within maxPoints. Always returns at least 0
 * (the root overview).
 */
const chooseDepthByBudget = (nodes, bbox, maxPoints, maxDepth) => {
  let chosen = 0;
  let cumulative = 0;
  for (let depth = 0; depth <= maxDepth; depth += 1) {
    const depthPoints = nodes
      .filter((n) => n.depth === depth && bboxesIntersect(n.extent, bbox))
      .reduce((sum, n) => sum + n.nPoints, 0);
    if (cumulative + depthPoints > maxPoints && depth > 0) break;
    cumulative += depthPoints;
    chosen = depth;
  }
  return chosen;
};

/**
 * Read the molecule points within a bbox at (or up to) a quadtree depth.
 *
 * @param {object} store ZipFileStore opened on the molecules.pyramid.zip
 * @param {object} opts
 * @param {[number,number,number,number]} opts.bbox [xmin, ymin, xmax, ymax] in microns
 * @param {number} [opts.depth] target quadtree depth (clamped to maxDepth)
 * @param {number[]} [opts.genes] feature_codes to keep; omit for all genes
 * @param {number} [opts.maxPoints] cap; pick the deepest depth whose union fits
 * @returns {Promise<{ x: Float32Array, y: Float32Array, featureCode: Int32Array, count: number }>}
 */
const loadMoleculeNodes = async (store, {
  bbox, depth, genes, maxPoints, maxRenderedPoints, maxRawPoints,
} = {}) => {
  if (!bbox || bbox.length !== 4) {
    throw new Error('loadMoleculeNodes: a [xmin, ymin, xmax, ymax] bbox is required');
  }

  const { meta, nodes } = await loadIndex(store);
  const maxDepth = meta.maxDepth ?? 0;

  // Optional gene filter as a fast Set membership test (shared by both paths).
  const geneSet = Array.isArray(genes) && genes.length ? new Set(genes) : null;
  const rowSurvives = (xs, ys, codes, i) => Number.isFinite(xs[i])
    && Number.isFinite(ys[i])
    && (!geneSet || geneSet.has(codes[i]));

  // ── Rendered-count budget (preferred for gene-filtered queries) ─────────────
  // The pyramid mixes all genes, so we read tiles level-by-level (root → deeper,
  // additive LOD) and budget the RENDERED points (rows surviving the gene filter),
  // not the raw molecules read.
  //
  // We include only COMPLETE levels: a level is added in full or not at all. A
  // partial level (stopping mid-way through its tiles) would drop a spatial region,
  // leaving holes that "appear" only when you zoom into them — the overview must be
  // a uniform spatial sample. Before reading a deeper level we ESTIMATE its rendered
  // count from the manifest's raw counts × the running keep-ratio, and stop if it
  // would blow the budget (so we don't even fetch a level we can't use). The root
  // (depth 0) is always included. A raw-read cap bounds very sparse genes.
  if (Number.isFinite(maxRenderedPoints)) {
    const rawCap = Number.isFinite(maxRawPoints) ? maxRawPoints : Infinity;
    const xsOut = [];
    const ysOut = [];
    const codesOut = [];
    let rawRead = 0;

    for (let d = 0; d <= maxDepth; d += 1) {
      const tilesAtDepth = nodes.filter(
        (n) => n.depth === d && bboxesIntersect(n.extent, bbox),
      );
      if (!tilesAtDepth.length) continue; // eslint-disable-line no-continue

      // Estimate this level's rendered count (raw × running keep-ratio) and skip the
      // whole level — without fetching it — if it would exceed the budget.
      const levelRaw = tilesAtDepth.reduce((sum, n) => sum + n.nPoints, 0);
      if (d > 0 && rawRead > 0) {
        const keepRatio = xsOut.length / rawRead;
        if (xsOut.length + levelRaw * keepRatio > maxRenderedPoints) break;
      }
      if (rawRead >= rawCap) break;

      // read this whole level's tiles in parallel (cached), then accumulate survivors
      // eslint-disable-next-line no-await-in-loop
      const chunks = await Promise.all(
        tilesAtDepth.map((node) => readTileParsed(store, node.key)),
      );

      for (let c = 0; c < chunks.length; c += 1) {
        const {
          xs, ys, codes, n,
        } = chunks[c];
        rawRead += n;
        for (let i = 0; i < n; i += 1) {
          if (rowSurvives(xs, ys, codes, i)) {
            xsOut.push(xs[i]); ysOut.push(ys[i]); codesOut.push(codes[i]);
          }
        }
      }
    }

    const count = xsOut.length;
    return {
      x: Float32Array.from(xsOut),
      y: Float32Array.from(ysOut),
      featureCode: Int32Array.from(codesOut),
      count,
    };
  }

  // 1. Decide the target depth: explicit, by point budget, or full depth.
  let targetDepth;
  if (Number.isInteger(depth)) {
    targetDepth = Math.max(0, Math.min(depth, maxDepth));
  } else if (Number.isFinite(maxPoints)) {
    targetDepth = chooseDepthByBudget(nodes, bbox, maxPoints, maxDepth);
  } else {
    targetDepth = maxDepth;
  }

  // 2. Select tiles at depth <= targetDepth whose extent intersects the bbox
  //    (ancestors included => additive LOD).
  const selected = nodes.filter(
    (n) => n.depth <= targetDepth && bboxesIntersect(n.extent, bbox),
  );

  // 3. Range-read + parse each selected tile (cached), collecting typed arrays.
  const chunks = await Promise.all(
    selected.map((node) => readTileParsed(store, node.key)),
  );

  // A row survives if both coordinates are finite (Phase-1 guard) and, when a
  // gene filter is given, its feature_code is in the keep-set (rowSurvives, hoisted).
  const survives = rowSurvives;

  // 4. Count surviving rows so the output typed arrays are sized once.
  let total = 0;
  chunks.forEach(({
    xs, ys, codes, n,
  }) => {
    for (let i = 0; i < n; i += 1) {
      if (survives(xs, ys, codes, i)) total += 1;
    }
  });

  // 5. Concatenate the surviving rows into flat typed arrays.
  const x = new Float32Array(total);
  const y = new Float32Array(total);
  const featureCode = new Int32Array(total);

  let w = 0;
  chunks.forEach(({
    xs, ys, codes, n,
  }) => {
    for (let i = 0; i < n; i += 1) {
      if (survives(xs, ys, codes, i)) {
        x[w] = xs[i];
        y[w] = ys[i];
        featureCode[w] = codes[i];
        w += 1;
      }
    }
  });

  return {
    x, y, featureCode, count: total,
  };
};

/**
 * Load the meta dictionary (genes/colors + build metadata) for a pyramid store.
 * Cached alongside the manifest.
 * @returns {Promise<object>} the parsed meta.json
 */
const loadMoleculeMeta = async (store) => {
  const { meta } = await loadIndex(store);
  return meta;
};

/**
 * Build a feature_code -> RGBA lookup from a meta.json. Colors are baked into the
 * pyramid by the pipeline so deck.gl and Vega render identical gene colors; we
 * just convert the stored hex to RGBA via the shared parseColor helper.
 *
 * @param {object} meta the parsed meta.json (or its `genes` array)
 * @returns {(code: number) => number[]} code -> [r, g, b, a]
 */
const buildMoleculeColorLookup = (meta) => {
  const genes = Array.isArray(meta) ? meta : (meta?.genes ?? []);
  const colors = genes.map(({ color }) => parseColor(color));
  const fallback = parseColor(null);
  return (code) => colors[code] ?? fallback;
};

export default loadMoleculeNodes;
export {
  loadMoleculeMeta,
  buildMoleculeColorLookup,
};

import {
  root as zarrRoot, open,
} from 'zarrita';
import ZipFileStore from 'components/data-exploration/spatial/ZipFileStore';

// Generic OME-Zarr pyramid access shared by the histology tile renderer
// (getImageUrls) and the segmentation region decoder (loadSegmentationOverlay).
// Kept in its own module so neither of those imports the other (which would be a
// cycle).

// ── Pyramid open, cached per signed URL ─────────────────────────────────────
// Opening reads only the multiscale metadata + each level's shape (no pixel
// data), so it's cheap; we still cache the opened arrays per URL so the base tile
// and every subsequent viewport tile reuse one open instead of re-reading
// metadata on each zoom. Histology and segmentation are different URLs → distinct
// cache entries.
// LRU-capped: keyed by the SIGNED url, which changes on every fetch, so without a
// cap a long session (each plot mount / sample switch re-signs the url) accumulates
// one zip store per url forever — and each store caches decompressed chunks as tiles
// stream, growing unbounded. Capping releases stores from no-longer-open slides.
const pyramidCache = new Map();
const PYRAMID_CACHE_MAX = 8;

export const openOmePyramid = (omeZarrUrl) => {
  if (pyramidCache.has(omeZarrUrl)) {
    // refresh LRU position
    const cached = pyramidCache.get(omeZarrUrl);
    pyramidCache.delete(omeZarrUrl);
    pyramidCache.set(omeZarrUrl, cached);
    return cached;
  }

  const promise = (async () => {
    const store = ZipFileStore.fromUrl(omeZarrUrl);
    const rootNode = zarrRoot(store);

    let datasets = [{ path: '0' }];
    let axesMetadata = null;
    try {
      const rootGroup = await open(rootNode, { kind: 'group' });
      const rootAttrs = await Promise.resolve(rootGroup.attrs);
      datasets = rootAttrs?.multiscales?.[0]?.datasets || datasets;
      axesMetadata = rootAttrs?.multiscales?.[0]?.axes || null;
    } catch (_e) {
      // multiscale metadata is optional — fall back to the default dataset path
    }

    const levels = await Promise.all(
      datasets.map(async ({ path }) => {
        const arr = await open(rootNode.resolve(path), { kind: 'array' });
        return { arr, shape: arr.shape };
      }),
    );

    const { shape } = levels[0];
    return {
      levels,
      axesMetadata,
      fullW: shape[shape.length - 1],
      fullH: shape[shape.length - 2],
    };
  })();
  promise.catch(() => pyramidCache.delete(omeZarrUrl));
  pyramidCache.set(omeZarrUrl, promise);

  // evict oldest entries (their stores + cached chunks are freed once unreferenced)
  while (pyramidCache.size > PYRAMID_CACHE_MAX) {
    pyramidCache.delete(pyramidCache.keys().next().value);
  }

  return promise;
};

/**
 * Pick the pyramid level + zarr index window for a data-space viewport.
 *
 * `viewport` = { xMin, xMax, yMin, yMax, outputWidth, outputHeight } in level-0
 * data coordinates. The level is the coarsest one that still has at least
 * `outputWidth × outputHeight` pixels across the requested fraction of the slide,
 * so zooming in selects progressively finer levels. The y window is flipped
 * (zarr row 0 = top = high data-y) so cropped tiles align with the y-up plot.
 *
 * Returns null for an empty viewport. `level` is the chosen pyramid index
 * (0 = full resolution); callers compare it to decide whether a detail tile adds
 * any resolution over the coarse base tile.
 */
export const resolvePyramidRegion = (levels, fullW, fullH, viewport) => {
  const {
    xMin, xMax, yMin, yMax, outputWidth, outputHeight,
  } = viewport;

  const vxMin = Math.max(0, Math.floor(xMin));
  const vxMax = Math.min(fullW, Math.ceil(xMax));
  const vyMin = Math.max(0, Math.floor(yMin));
  const vyMax = Math.min(fullH, Math.ceil(yMax));
  if (vxMax <= vxMin || vyMax <= vyMin) return null;

  const fracX = (vxMax - vxMin) / fullW;
  const fracY = (vyMax - vyMin) / fullH;

  let level = 0;
  for (let i = levels.length - 1; i >= 0; i -= 1) {
    const lw = levels[i].shape[levels[i].shape.length - 1];
    const lh = levels[i].shape[levels[i].shape.length - 2];
    if (fracX * lw >= outputWidth && fracY * lh >= outputHeight) {
      level = i;
      break;
    }
  }

  const { shape } = levels[level];
  const ndim = shape.length;
  const lh = shape[ndim - 2];
  const lw = shape[ndim - 1];
  const scaleX = lw / fullW;
  const scaleY = lh / fullH;

  const x0 = Math.max(0, Math.floor(vxMin * scaleX));
  const x1 = Math.min(lw, Math.ceil(vxMax * scaleX));
  const y0 = Math.max(0, Math.floor((fullH - vyMax) * scaleY));
  const y1 = Math.min(lh, Math.ceil((fullH - vyMin) * scaleY));

  const regionW = x1 - x0;
  const regionH = y1 - y0;
  if (regionW <= 0 || regionH <= 0) return null;

  return {
    level,
    shape,
    ndim,
    x0,
    x1,
    y0,
    y1,
    regionW,
    regionH,
    extent: {
      xMin: vxMin, xMax: vxMax, yMin: vyMin, yMax: vyMax,
    },
  };
};

// Pick the coarsest pyramid level that still has >= outputWidth x outputHeight
// pixels across the requested fraction of the slide (so deeper zoom selects finer
// levels). 0 = full resolution. Shared by the tile streamer.
export const pickLevel = (levels, fullW, fullH, viewport) => {
  const {
    xMin, xMax, yMin, yMax, outputWidth, outputHeight,
  } = viewport;
  const vxMin = Math.max(0, xMin);
  const vxMax = Math.min(fullW, xMax);
  const vyMin = Math.max(0, yMin);
  const vyMax = Math.min(fullH, yMax);
  const fracX = Math.max(0, vxMax - vxMin) / fullW;
  const fracY = Math.max(0, vyMax - vyMin) / fullH;

  let level = 0;
  for (let i = levels.length - 1; i >= 0; i -= 1) {
    const lw = levels[i].shape[levels[i].shape.length - 1];
    const lh = levels[i].shape[levels[i].shape.length - 2];
    if (fracX * lw >= outputWidth && fracY * lh >= outputHeight) {
      level = i;
      break;
    }
  }
  return level;
};

/**
 * The tiles at `level` (TILE_SIZE level-pixels each) that intersect a data-space
 * viewport. Each descriptor carries the level-pixel window [x0,x1)x[y0,y1) and the
 * data-space extent it covers (y-flipped: zarr row 0 = top = high data-y), so tiles
 * tile the plane without gaps or overlap and align with the y-up plot.
 *
 * @returns {Array<{ level, tx, ty, x0, x1, y0, y1, extent }>}
 */
export const tilesForViewport = (levels, fullW, fullH, level, viewport, tileSize) => {
  const { shape } = levels[level];
  const lw = shape[shape.length - 1];
  const lh = shape[shape.length - 2];
  const scaleX = lw / fullW;
  const scaleY = lh / fullH;

  // viewport -> level pixels (x direct, y flipped)
  const vx0 = Math.max(0, Math.floor(Math.max(0, viewport.xMin) * scaleX));
  const vx1 = Math.min(lw, Math.ceil(Math.min(fullW, viewport.xMax) * scaleX));
  const ry0 = Math.max(0, Math.floor((fullH - Math.min(fullH, viewport.yMax)) * scaleY));
  const ry1 = Math.min(lh, Math.ceil((fullH - Math.max(0, viewport.yMin)) * scaleY));
  if (vx1 <= vx0 || ry1 <= ry0) return [];

  const txStart = Math.floor(vx0 / tileSize);
  const txEnd = Math.floor((vx1 - 1) / tileSize);
  const tyStart = Math.floor(ry0 / tileSize);
  const tyEnd = Math.floor((ry1 - 1) / tileSize);

  const tiles = [];
  for (let ty = tyStart; ty <= tyEnd; ty += 1) {
    for (let tx = txStart; tx <= txEnd; tx += 1) {
      const x0 = tx * tileSize;
      const y0 = ty * tileSize;
      const x1 = Math.min(lw, (tx + 1) * tileSize);
      const y1 = Math.min(lh, (ty + 1) * tileSize);
      if (x1 <= x0 || y1 <= y0) continue; // eslint-disable-line no-continue
      tiles.push({
        level,
        tx,
        ty,
        x0,
        x1,
        y0,
        y1,
        // data extent — row y0 (top) maps to the larger data-y (yMax)
        extent: {
          xMin: (x0 / lw) * fullW,
          xMax: (x1 / lw) * fullW,
          yMin: fullH * (1 - y1 / lh),
          yMax: fullH * (1 - y0 / lh),
        },
      });
    }
  }
  return tiles;
};

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

// ── Per-level coordinate frame ──────────────────────────────────────────────
// Every tile is positioned in the plot from its data-space extent. To keep the
// coarse fallback tile and the finer target tile REGISTERED (no positional jump
// when a sharper tile streams in), all levels must map onto ONE coordinate frame
// (level-0 pixels). We express each level as an affine map
//   fullPx = levelPx / pxPerFull + offsetFull   (so levelPx = (fullPx - offset) * pxPerFull)
// and store pxPerFullX/Y + offsetFullX/Y per level.
//
// The trap we're avoiding: reconstructing the scale as levelWidth/fullWidth is
// WRONG whenever a level's dimensions were floor-rounded (e.g. 4001 → 250 at a 16×
// level gives 16.004, not 16). Across the slide that few-pixel drift is the
// positional shift you see when a sharp tile replaces a coarse one. We instead pin
// each level to the EXACT downsample factor.
//
// Two sources for that exact factor, in priority order:
//  1. OME-Zarr v0.4+ `coordinateTransformations` (scale [+ translation] per dataset):
//     pxPerFull = s0/sL, offsetFull = (tL - t0)/s0.
//  2. v0.3 and earlier carry NO transforms. Our pyramids are written by
//     ome_zarr.writer.write_image with integer scale_factors [2,4,8,16] (skimage
//     resize, which aligns pixel CENTRES — so an exact integer factor with
//     offset 0 is correct; there is no half-pixel term). We recover those integer
//     factors by rounding the ratio between CONSECUTIVE level dims (robust at coarse
//     levels, where the level-0 ratio has drifted) and accumulating.
const scaleOf = (cts) => (cts || []).find((t) => t.type === 'scale')?.scale;
const translationOf = (cts) => (cts || []).find((t) => t.type === 'translation')?.translation;

const widthOf = (lvl) => lvl.shape[lvl.shape.length - 1];
const heightOf = (lvl) => lvl.shape[lvl.shape.length - 2];

function attachLevelTransforms(levels, axesMetadata) {
  const { shape } = levels[0];
  const ndim = shape.length;
  let xAxis = ndim - 1;
  let yAxis = ndim - 2;
  if (axesMetadata) {
    const xi = axesMetadata.findIndex((a) => a.name === 'x');
    const yi = axesMetadata.findIndex((a) => a.name === 'y');
    if (xi >= 0) xAxis = xi;
    if (yi >= 0) yAxis = yi;
  }

  const s0 = scaleOf(levels[0].coordinateTransformations);

  /* eslint-disable no-param-reassign */
  if (s0 && s0[xAxis] && s0[yAxis]) {
    // (1) v0.4+: exact scale/translation transforms.
    const t0 = translationOf(levels[0].coordinateTransformations) || [];
    const s0x = s0[xAxis];
    const s0y = s0[yAxis];
    const t0x = t0[xAxis] || 0;
    const t0y = t0[yAxis] || 0;
    levels.forEach((lvl) => {
      const sL = scaleOf(lvl.coordinateTransformations);
      if (!sL || !sL[xAxis] || !sL[yAxis]) return; // → shape-ratio fallback in axisMap*
      const tL = translationOf(lvl.coordinateTransformations) || [];
      lvl.pxPerFullX = s0x / sL[xAxis];
      lvl.pxPerFullY = s0y / sL[yAxis];
      lvl.offsetFullX = ((tL[xAxis] || 0) - t0x) / s0x;
      lvl.offsetFullY = ((tL[yAxis] || 0) - t0y) / s0y;
    });
    return;
  }

  // (2) v0.3 / no transforms: infer exact integer factors from consecutive dims.
  let cumX = 1;
  let cumY = 1;
  levels.forEach((lvl, i) => {
    if (i > 0) {
      cumX *= Math.max(1, Math.round(widthOf(levels[i - 1]) / widthOf(lvl)));
      cumY *= Math.max(1, Math.round(heightOf(levels[i - 1]) / heightOf(lvl)));
    }
    lvl.pxPerFullX = 1 / cumX;
    lvl.pxPerFullY = 1 / cumY;
    lvl.offsetFullX = 0;
    lvl.offsetFullY = 0;
  });
  /* eslint-enable no-param-reassign */
}

// level pixels per level-0 pixel (`k`) and level-0-pixel offset (`b`) for a level,
// per axis. Uses the affine attached by attachLevelTransforms; falls back to the
// shape ratio with no offset — identical to the historical levelWidth/fullWidth math
// — only for synthetic levels passed straight to these pure helpers (unit tests),
// since openOmePyramid always attaches an affine for real pyramids.
const axisMapX = (lvl, fullW) => ({
  k: lvl.pxPerFullX ?? (lvl.shape[lvl.shape.length - 1] / fullW),
  b: lvl.offsetFullX ?? 0,
});
const axisMapY = (lvl, fullH) => ({
  k: lvl.pxPerFullY ?? (lvl.shape[lvl.shape.length - 2] / fullH),
  b: lvl.offsetFullY ?? 0,
});

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
      datasets.map(async ({ path, coordinateTransformations }) => {
        const arr = await open(rootNode.resolve(path), { kind: 'array' });
        return { arr, shape: arr.shape, coordinateTransformations };
      }),
    );

    const { shape } = levels[0];
    const fullW = shape[shape.length - 1];
    const fullH = shape[shape.length - 2];

    attachLevelTransforms(levels, axesMetadata);

    return {
      levels,
      axesMetadata,
      fullW,
      fullH,
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
  const { k: kx, b: bx } = axisMapX(levels[level], fullW);
  const { k: ky, b: by } = axisMapY(levels[level], fullH);

  const x0 = Math.max(0, Math.floor((vxMin - bx) * kx));
  const x1 = Math.min(lw, Math.ceil((vxMax - bx) * kx));
  const y0 = Math.max(0, Math.floor(((fullH - vyMax) - by) * ky));
  const y1 = Math.min(lh, Math.ceil(((fullH - vyMin) - by) * ky));

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
  const { k: kx, b: bx } = axisMapX(levels[level], fullW);
  const { k: ky, b: by } = axisMapY(levels[level], fullH);

  // viewport -> level pixels (x direct, y flipped)
  const vx0 = Math.max(0, Math.floor((Math.max(0, viewport.xMin) - bx) * kx));
  const vx1 = Math.min(lw, Math.ceil((Math.min(fullW, viewport.xMax) - bx) * kx));
  const ry0 = Math.max(0, Math.floor(((fullH - Math.min(fullH, viewport.yMax)) - by) * ky));
  const ry1 = Math.min(lh, Math.ceil(((fullH - Math.max(0, viewport.yMin)) - by) * ky));
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
        // data extent (level-0 frame, forward affine) — row y0 (top) maps to the
        // larger data-y (yMax). Using the shared per-level map keeps coarse and
        // fine tiles registered, so streaming a sharper tile in never shifts it.
        extent: {
          xMin: x0 / kx + bx,
          xMax: x1 / kx + bx,
          yMin: fullH - (y1 / ky + by),
          yMax: fullH - (y0 / ky + by),
        },
      });
    }
  }
  return tiles;
};

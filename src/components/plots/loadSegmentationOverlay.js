import { get, slice } from 'zarrita';
import { ResourceLoader } from 'vega';
import { resolvePyramidRegion } from './zarrPyramid';

export const parseHexColor = (hex) => {
  const clean = (hex ?? '').replace('#', '');
  if (clean.length < 6) return [128, 128, 128];
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
};

// Returns true if pixel (row, col) labelled `v` lies on its cell's boundary
// (4-connected: differs from at least one neighbour). Background is label 0.
const isCellEdge = (flatData, row, col, regionW, regionH, v) => {
  const top = row > 0 ? flatData[(row - 1) * regionW + col] : 0;
  const bottom = row < regionH - 1 ? flatData[(row + 1) * regionW + col] : 0;
  const left = col > 0 ? flatData[row * regionW + (col - 1)] : 0;
  const right = col < regionW - 1 ? flatData[row * regionW + (col + 1)] : 0;
  return top !== v || bottom !== v || left !== v || right !== v;
};

/**
 * Decode one segmentation-label tile from an already-opened pyramid for the given
 * data-space viewport. Mirrors renderImageTile's level/region selection (shared
 * resolvePyramidRegion) so the segmentation tile aligns pixel-for-pixel with the
 * histology tile at the same viewport. Coarser pyramid levels are
 * nearest-neighbour downsamples (per the OME-Zarr label convention), so label
 * values — hence cell IDs — are preserved at every level.
 *
 * @param {object} pyramid   result of openOmePyramid (segmentation zarr)
 * @param {object} viewport  { xMin, xMax, yMin, yMax, outputWidth, outputHeight }
 * @returns {{ flatData, regionW, regionH, extent, level } | null}
 *   extent is the data-space rectangle this tile covers.
 */
export const decodeSegmentationRegion = async (pyramid, viewport) => {
  try {
    const {
      levels, fullW, fullH,
    } = pyramid;
    const region = resolvePyramidRegion(levels, fullW, fullH, viewport);
    if (!region) return null;

    const {
      level, shape, ndim, x0, x1, y0, y1, regionW, regionH, extent,
    } = region;
    const { arr } = levels[level];

    // Label arrays have no channel axis: pin every leading dim to 0, window the
    // last two (y, x).
    const selection = shape.map((_, dimIdx) => {
      if (dimIdx === ndim - 2) return slice(y0, y1);
      if (dimIdx === ndim - 1) return slice(x0, x1);
      return 0;
    });
    const ndArray = await get(arr, selection);

    return {
      flatData: ndArray.data,
      regionW,
      regionH,
      extent,
      level,
    };
  } catch (e) {
    console.error('[decodeSegmentationRegion]', e);
    return null;
  }
};

/**
 * Read one segmentation-label tile at an EXPLICIT level/pixel window (from
 * tilesForViewport) — used by the viewport tile streamer. Coarser levels are
 * nearest-neighbour label downsamples, so cell IDs are preserved at every level.
 *
 * A 1px HALO is read around the tile (clamped at the image edge) so outline
 * edge-detection has the true neighbours across tile boundaries — otherwise every
 * tile seam would be drawn as a fake cell outline. Only the inner tile area is
 * rendered (see colorSegmentationOverlay's inner* offsets).
 *
 * @param {object} pyramid  result of openOmePyramid (segmentation zarr)
 * @param {object} tile     { level, x0, x1, y0, y1, extent } from tilesForViewport
 * @returns {{ flatData, regionW, regionH, innerX, innerY, innerW, innerH, extent } | null}
 */
export const readSegTile = async (pyramid, tile) => {
  try {
    const { levels } = pyramid;
    const {
      level, x0, x1, y0, y1, extent,
    } = tile;
    const { arr, shape } = levels[level];
    const ndim = shape.length;
    const lw = shape[ndim - 1];
    const lh = shape[ndim - 2];

    const hx0 = Math.max(0, x0 - 1);
    const hx1 = Math.min(lw, x1 + 1);
    const hy0 = Math.max(0, y0 - 1);
    const hy1 = Math.min(lh, y1 + 1);

    const selection = shape.map((_, dimIdx) => {
      if (dimIdx === ndim - 2) return slice(hy0, hy1);
      if (dimIdx === ndim - 1) return slice(hx0, hx1);
      return 0;
    });
    const ndArray = await get(arr, selection);

    return {
      flatData: ndArray.data,
      regionW: hx1 - hx0, // haloed dims
      regionH: hy1 - hy0,
      innerX: x0 - hx0, // inner tile offset within the halo (0 or 1)
      innerY: y0 - hy0,
      innerW: x1 - x0, // rendered tile dims
      innerH: y1 - y0,
      extent,
    };
  } catch (e) {
    console.error('[readSegTile]', e);
    return null;
  }
};

// ── Drawable registry ──────────────────────────────────────────────────────
// Registry of drawables (canvas / image) addressed by a synthetic `seg-overlay://`
// URL, so Vega can paint them directly — see patchResourceLoader. Used for BOTH the
// coloured segmentation overlay tiles and the histology tiles.
const drawableRegistry = new Map();
let drawableCounter = 0;

// persistent ImageData buffer per reused canvas (see colorSegmentationOverlay)
const imageDataCache = new WeakMap();

/**
 * Register a drawable (canvas/image) and return a synthetic URL token. Handing the
 * drawable to Vega this way skips the heavy PNG round-trip (toDataURL on our side +
 * Vega re-decoding the PNG into an <img> on every view rebuild) — the only cost
 * left is a GPU drawImage().
 */
export const registerDrawable = (drawable) => {
  drawableCounter += 1;
  const token = `seg-overlay://${drawableCounter}`;
  drawableRegistry.set(token, drawable);
  return token;
};

const getDrawable = (token) => drawableRegistry.get(token);

// Release a registered drawable once Vega has moved on (e.g. a superseded tile),
// so the registry doesn't accumulate stale canvases across recolours/zoom.
export const releaseOverlay = (token) => {
  if (token) drawableRegistry.delete(token);
};

/* eslint-disable no-underscore-dangle */ // reaching into Vega ResourceLoader internals
// Patch Vega's ResourceLoader ONCE at module load so our `seg-overlay://` tokens
// resolve to the live canvas/image for ALL views — crucially including the very
// first render (a per-view onNewView patch would miss URLs already baked into the
// spec). Routed through the loader's pending counter so Vega's "redraw once the
// image is ready" machinery still fires. Any non-token URL falls through to the
// original loader untouched.
let resourceLoaderPatched = false;
const patchResourceLoader = () => {
  if (resourceLoaderPatched) return;
  const proto = ResourceLoader.prototype;
  const originalLoadImage = proto.loadImage;
  proto.loadImage = function loadImage(uri) {
    const drawable = getDrawable(uri);
    if (!drawable) return originalLoadImage.call(this, uri);
    this._pending += 1;
    return Promise.resolve().then(() => {
      this._pending -= 1;
      return drawable;
    });
  };
  resourceLoaderPatched = true;
};
patchResourceLoader();
/* eslint-enable no-underscore-dangle */

/**
 * Paint a coloured overlay from a decoded segmentation tile onto a canvas and hand
 * that canvas to Vega (via the registry above). Cheap (no network/zarr, no PNG
 * encode), so it can run on every colour/threshold change and per viewport tile.
 *
 * @param {object} decoded  result of decodeSegmentationRegion
 * @param {Map<number, [r,g,b] | [r,g,b,a]>} cellColorMap  0-indexed cell ID → colour.
 *   A 4th element overrides the global opacity for that cell (0–255 alpha).
 * @param {object} options  { opacity: 0–1, outline: boolean, canvas?: HTMLCanvasElement }
 *   Pass a persistent `canvas` (one per layer) to avoid re-allocating the canvas and
 *   its pixel buffer on every recolour. The fill pass writes every pixel's alpha, so
 *   reusing the buffer needs no explicit clear.
 * @returns {{ overlayUrl, overlayExtent } | null}
 */
/**
 * Pure pixel-painting for a decoded segmentation tile — writes RGBA into `px`
 * (a Uint8ClampedArray sized innerW*innerH*4). Extracted from colorSegmentation
 * Overlay so the colour/visibility/outline logic is unit-testable without a canvas.
 *
 * Cells absent from `cellColorMap` (background, or filtered out in a previous step)
 * are left transparent, and outlines are drawn only for cells in the map — matching
 * the Data Exploration segmentation layer (which discards un-coloured cells) rather
 * than showing a default grey.
 */
/* eslint-disable no-param-reassign */ // writing RGBA into the caller's pixel buffer
export const paintSegOverlayPixels = (px, decoded, cellColorMap, options = {}) => {
  const { opacity = 0.7, outline = false } = options;
  const fillAlpha = Math.round(opacity * 255);
  const { flatData, regionW, regionH } = decoded;
  // The decoded data may carry a 1px halo for edge-detection; render only the inner
  // tile area and sample the (possibly haloed) source via these offsets. Defaults
  // make this a no-op for un-haloed full-region decodes.
  const innerX = decoded.innerX ?? 0;
  const innerY = decoded.innerY ?? 0;
  const innerW = decoded.innerW ?? regionW;
  const innerH = decoded.innerH ?? regionH;

  // ── Fill pass (over the inner tile, sampling the haloed source) ─────────────
  for (let r = 0; r < innerH; r += 1) {
    for (let c = 0; c < innerW; c += 1) {
      const v = flatData[(r + innerY) * regionW + (c + innerX)];
      const b = (r * innerW + c) * 4;
      const color = v === 0 ? null : cellColorMap.get(v - 1); // bitmask is 1-indexed
      if (color) {
        [px[b], px[b + 1], px[b + 2]] = color;
        // a 4th element overrides the global opacity for this cell
        px[b + 3] = color.length >= 4 ? color[3] : fillAlpha;
      } else {
        px[b + 3] = 0; // background or filtered-out cell → hidden
      }
    }
  }

  // ── Outline pass — edge-detect in haloed coords so tile seams aren't drawn ───
  if (outline) {
    for (let r = 0; r < innerH; r += 1) {
      for (let c = 0; c < innerW; c += 1) {
        const hr = r + innerY;
        const hc = c + innerX;
        const v = flatData[hr * regionW + hc];
        if (v !== 0 && cellColorMap.has(v - 1)
          && isCellEdge(flatData, hr, hc, regionW, regionH, v)) {
          px[(r * innerW + c) * 4 + 3] = 255;
        }
      }
    }
  }
};
/* eslint-enable no-param-reassign */

export const colorSegmentationOverlay = (decoded, cellColorMap, options = {}) => {
  if (!decoded) return null;
  const { canvas: reuseCanvas = null } = options;
  const { regionW, regionH, extent } = decoded;
  const innerW = decoded.innerW ?? regionW;
  const innerH = decoded.innerH ?? regionH;

  const canvas = reuseCanvas || document.createElement('canvas');
  if (canvas.width !== innerW) canvas.width = innerW;
  if (canvas.height !== innerH) canvas.height = innerH;
  const ctx = canvas.getContext('2d');

  // reuse one ImageData buffer per canvas — re-allocating it each recolour churns
  // the GC during long slider drags
  let imgData = imageDataCache.get(canvas);
  if (!imgData || imgData.width !== innerW || imgData.height !== innerH) {
    imgData = ctx.createImageData(innerW, innerH);
    imageDataCache.set(canvas, imgData);
  }

  paintSegOverlayPixels(imgData.data, decoded, cellColorMap, options);

  ctx.putImageData(imgData, 0, 0);

  // hand the canvas itself to Vega (resolved by patchResourceLoader) rather than
  // PNG-encoding it — no toDataURL, no re-decode, just a GPU drawImage(canvas)
  return { overlayUrl: registerDrawable(canvas), overlayExtent: extent };
};

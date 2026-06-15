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
export const colorSegmentationOverlay = (decoded, cellColorMap, options = {}) => {
  if (!decoded) return null;
  const { opacity = 0.7, outline = false, canvas: reuseCanvas = null } = options;
  const fillAlpha = Math.round(opacity * 255);
  const {
    flatData, regionW, regionH, extent,
  } = decoded;

  const canvas = reuseCanvas || document.createElement('canvas');
  if (canvas.width !== regionW) canvas.width = regionW;
  if (canvas.height !== regionH) canvas.height = regionH;
  const ctx = canvas.getContext('2d');

  // reuse one ImageData buffer per canvas — re-allocating it each recolour churns
  // the GC during long slider drags
  let imgData = imageDataCache.get(canvas);
  if (!imgData || imgData.width !== regionW || imgData.height !== regionH) {
    imgData = ctx.createImageData(regionW, regionH);
    imageDataCache.set(canvas, imgData);
  }
  const px = imgData.data;

  // ── Fill pass ─────────────────────────────────────────────────────────────
  for (let i = 0; i < flatData.length; i += 1) {
    const v = flatData[i];
    const b = i * 4;
    if (v === 0) {
      px[b + 3] = 0; // background → transparent
    } else {
      const color = cellColorMap.get(v - 1); // bitmask is 1-indexed
      if (color) {
        [px[b], px[b + 1], px[b + 2]] = color;
        // a 4th element overrides the global opacity for this cell
        px[b + 3] = color.length >= 4 ? color[3] : fillAlpha;
      } else {
        // Cell in bitmask but not in active colour scheme → dimmer grey
        px[b] = 128; px[b + 1] = 128; px[b + 2] = 128;
        px[b + 3] = Math.round(fillAlpha * 0.5);
      }
    }
  }

  // ── Outline pass (4-connected edge detection) ──────────────────────────────
  if (outline) {
    for (let row = 0; row < regionH; row += 1) {
      for (let col = 0; col < regionW; col += 1) {
        const flatIdx = row * regionW + col;
        const v = flatData[flatIdx];
        if (v !== 0 && isCellEdge(flatData, row, col, regionW, regionH, v)) {
          px[flatIdx * 4 + 3] = 255;
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);

  // hand the canvas itself to Vega (resolved by patchResourceLoader) rather than
  // PNG-encoding it — no toDataURL, no re-decode, just a GPU drawImage(canvas)
  return { overlayUrl: registerDrawable(canvas), overlayExtent: extent };
};

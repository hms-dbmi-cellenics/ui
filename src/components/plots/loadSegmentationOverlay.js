import {
  root as zarrRoot, open, get, slice,
} from 'zarrita';
import { ResourceLoader } from 'vega';
import ZipFileStore from 'components/data-exploration/spatial/ZipFileStore';

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
 * Decode the full-resolution (level-0) segmentation label bitmask from an
 * ome-zarr. Returns the raw label array + dimensions; the colouring is done
 * separately by colorSegmentationOverlay so the expensive zarr decode can be
 * cached and shared across plots (see spatialTileCache).
 *
 * @param {string} segmentationUrl
 * @returns {Promise<{ flatData, regionW, regionH, extent } | null>}
 */
export const decodeSegmentationBitmask = async (segmentationUrl) => {
  try {
    const store = ZipFileStore.fromUrl(segmentationUrl);
    const rootNode = zarrRoot(store);

    let datasets = [{ path: '0' }];
    try {
      const rootGroup = await open(rootNode, { kind: 'group' });
      const rootAttrs = await Promise.resolve(rootGroup.attrs);
      datasets = rootAttrs?.multiscales?.[0]?.datasets || datasets;
    } catch (_e) {
      // multiscale metadata is optional — fall back to the default dataset path
    }

    // level 0 is the full-resolution image, so the displayed segmentation is sharp
    const arr = await open(rootNode.resolve(datasets[0].path), { kind: 'array' });
    const { shape } = arr;
    const regionH = shape[shape.length - 2];
    const regionW = shape[shape.length - 1];

    const leadingDims = shape.slice(0, -2).map(() => 0);
    const selection = [...leadingDims, slice(0, regionH), slice(0, regionW)];
    const ndArray = await get(arr, selection);

    return {
      flatData: ndArray.data,
      regionW,
      regionH,
      extent: {
        xMin: 0, xMax: regionW, yMin: 0, yMax: regionH,
      },
    };
  } catch (e) {
    console.error('[decodeSegmentationBitmask]', e);
    return null;
  }
};

// ── Drawable registry ──────────────────────────────────────────────────────
// Registry of drawables (canvas / image) addressed by a synthetic `seg-overlay://`
// URL, so Vega can paint them directly — see patchResourceLoader. Used for BOTH the
// coloured segmentation overlay and the full-resolution histology tile.
const drawableRegistry = new Map();
let drawableCounter = 0;

// persistent ImageData buffer per reused canvas (see colorSegmentationOverlay)
const imageDataCache = new WeakMap();

/**
 * Register a drawable (canvas/image) and return a synthetic URL token. Handing the
 * drawable to Vega this way skips the heavy PNG round-trip (toDataURL on our side +
 * Vega re-decoding the PNG into an <img> on every view rebuild) — the only cost
 * left is a GPU drawImage(). The histology tile is registered once per slide and
 * reused across every spatial plot in the app (cached in spatialTileCache).
 */
export const registerDrawable = (drawable) => {
  drawableCounter += 1;
  const token = `seg-overlay://${drawableCounter}`;
  drawableRegistry.set(token, drawable);
  return token;
};

const getDrawable = (token) => drawableRegistry.get(token);

// Release a registered drawable once Vega has moved on (e.g. a superseded overlay),
// so the registry doesn't accumulate stale full-resolution canvases across recolours.
export const releaseOverlay = (token) => {
  if (token) drawableRegistry.delete(token);
};

// ── Coloured-overlay snapshot cache ─────────────────────────────────────────
// Content-addressed cache of IMMUTABLE overlay snapshots. Re-colouring the
// full-resolution bitmask is the expensive per-pixel pass that "redraws" the
// segmentation every time a spatial plot remounts (e.g. navigating back to the
// page). Caching a snapshot keyed by all the colour-affecting inputs lets a
// revisit reuse the exact overlay instantly (a GPU blit) instead of recolouring.
// LRU-capped because each snapshot is a full-resolution canvas.
const overlaySnapshotCache = new Map(); // key -> { overlayUrl, overlayExtent }
const OVERLAY_SNAPSHOT_CACHE_MAX = 4;

export const getOverlaySnapshot = (key) => {
  if (!key) return null;
  const hit = overlaySnapshotCache.get(key);
  if (!hit) return null;
  // refresh LRU position
  overlaySnapshotCache.delete(key);
  overlaySnapshotCache.set(key, hit);
  return hit;
};

// Clone the just-painted canvas into an immutable snapshot and cache it under `key`.
// Cloning (rather than caching the live, reused canvas) is essential: the per-plot
// canvas gets repainted on the next recolour, which would otherwise corrupt the
// cached entry.
export const cacheOverlaySnapshot = (key, sourceCanvas, overlayExtent) => {
  if (!key || !sourceCanvas || overlaySnapshotCache.has(key)) return;

  const snapshot = document.createElement('canvas');
  snapshot.width = sourceCanvas.width;
  snapshot.height = sourceCanvas.height;
  snapshot.getContext('2d').drawImage(sourceCanvas, 0, 0);

  overlaySnapshotCache.set(key, {
    overlayUrl: registerDrawable(snapshot),
    overlayExtent,
  });

  while (overlaySnapshotCache.size > OVERLAY_SNAPSHOT_CACHE_MAX) {
    const oldestKey = overlaySnapshotCache.keys().next().value;
    const old = overlaySnapshotCache.get(oldestKey);
    overlaySnapshotCache.delete(oldestKey);
    if (old) releaseOverlay(old.overlayUrl);
  }
};

/* eslint-disable no-underscore-dangle */ // reaching into Vega ResourceLoader internals
// Patch Vega's ResourceLoader ONCE at module load so our `seg-overlay://` tokens
// resolve to the live canvas/image for ALL views — crucially including the very
// first render (a per-view onNewView patch would miss URLs already baked into the
// spec, such as the histology tile). Routed through the loader's pending counter so
// Vega's "redraw once the image is ready" machinery still fires. Any non-token URL
// falls through to the original loader untouched.
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
 * Paint a coloured overlay from a decoded bitmask onto a canvas and hand that
 * canvas to Vega (via the registry above). Cheap (no network/zarr, no PNG
 * encode), so it can run on every colour/threshold change.
 *
 * @param {object} decoded  result of decodeSegmentationBitmask
 * @param {Map<number, [r,g,b] | [r,g,b,a]>} cellColorMap  0-indexed cell ID → colour.
 *   A 4th element overrides the global opacity for that cell (0–255 alpha).
 * @param {object} options  { opacity: 0–1, outline: boolean, canvas?: HTMLCanvasElement }
 *   Pass a persistent `canvas` (one per plot) to avoid re-allocating the canvas and
 *   its ~regionW·regionH·4-byte pixel buffer on every recolour (the dominant GC cost
 *   at full resolution). The fill pass writes every pixel's alpha, so reusing the
 *   buffer needs no explicit clear.
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

  // reuse one ImageData buffer per canvas — re-allocating it each recolour
  // (~144 MB at 6000²) is what makes long slider drags churn the GC
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

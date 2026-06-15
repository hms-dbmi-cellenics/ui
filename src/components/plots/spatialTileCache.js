import { openOmePyramid, renderImageTile } from './getImageUrls';
import { decodeSegmentationRegion } from './loadSegmentationOverlay';

// Shared, in-memory caches for the BASE (full-extent overview) spatial layers.
// Keyed by a stable experiment+sample key (NOT the signed URL, which changes per
// request) so the overview histology tile and segmentation labels are
// fetched/decoded once and reused across every spatial plot (Plots & Tables + Data
// Processing) and across remounts.
//
// The base layer is the lowest-resolution full-slide tile/labels — small and fast —
// always shown so zooming out never blanks. Finer DETAIL tiles for the current
// viewport are fetched on demand by useSpatialStream (not cached here; they're
// transient and cheap to refetch from the per-URL pyramid open).

// Target pixel size for the base/overview tile (long side). Fixed (not the plot's
// display size) so one base entry is shared across every plot of a sample
// regardless of how large each renders it, and stays crisp when zoomed fully out.
export const BASE_OUTPUT = 1024;

const imageCache = new Map();
const bitmaskCache = new Map();

// Synchronously-readable caches of the RESOLVED base layers, so a remounting plot
// (e.g. switching Data Processing steps) can initialise immediately from cache
// instead of waiting on the signed-URL fetch → decode chain and flashing a redraw.
const imageResolvedCache = new Map();
const bitmaskResolvedCache = new Map();

export const peekBaseImage = (cacheKey) => imageResolvedCache.get(cacheKey) || null;
export const peekBaseSegmentation = (cacheKey) => bitmaskResolvedCache.get(cacheKey) || null;

/**
 * Base (overview) histology tile for a sample, cached by key.
 * @returns {Promise<{ imageUrl, imageWidth, imageHeight, imageExtent, level } | null>}
 */
export const loadBaseImage = (omeZarrUrl, cacheKey) => {
  if (!imageCache.has(cacheKey)) {
    const promise = (async () => {
      const pyramid = await openOmePyramid(omeZarrUrl);
      // full extent at the base output size → resolvePyramidRegion picks the
      // coarsest level that still meets BASE_OUTPUT across the whole slide
      return renderImageTile(pyramid, {
        xMin: 0,
        xMax: pyramid.fullW,
        yMin: 0,
        yMax: pyramid.fullH,
        outputWidth: BASE_OUTPUT,
        outputHeight: BASE_OUTPUT,
      });
    })();
    promise.catch(() => imageCache.delete(cacheKey));
    promise.then((value) => { if (value) imageResolvedCache.set(cacheKey, value); });
    imageCache.set(cacheKey, promise);
  }
  return imageCache.get(cacheKey);
};

/**
 * Base (overview) segmentation labels for a sample, cached by key. The (cheap)
 * per-view colouring is applied separately via colorSegmentationOverlay.
 * @returns {Promise<{ flatData, regionW, regionH, extent, level } | null>}
 */
export const loadBaseSegmentation = (omeZarrUrl, cacheKey) => {
  if (!bitmaskCache.has(cacheKey)) {
    const promise = (async () => {
      const pyramid = await openOmePyramid(omeZarrUrl);
      return decodeSegmentationRegion(pyramid, {
        xMin: 0,
        xMax: pyramid.fullW,
        yMin: 0,
        yMax: pyramid.fullH,
        outputWidth: BASE_OUTPUT,
        outputHeight: BASE_OUTPUT,
      });
    })();
    promise.catch(() => bitmaskCache.delete(cacheKey));
    promise.then((value) => { if (value) bitmaskResolvedCache.set(cacheKey, value); });
    bitmaskCache.set(cacheKey, promise);
  }
  return bitmaskCache.get(cacheKey);
};

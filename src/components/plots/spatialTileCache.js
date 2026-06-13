import getImageUrls, { getImageDimensions } from './getImageUrls';
import { decodeSegmentationBitmask } from './loadSegmentationOverlay';

// Shared, in-memory caches for decoded spatial tiles. Keyed by a stable
// experiment+sample key (NOT the signed URL, which changes per request) so the
// full-resolution histology image and segmentation bitmask are fetched/decoded
// once and reused across every spatial plot (Plots & Tables + Data Processing),
// instead of each component loading them independently.
//
// We cache the in-flight Promise, so concurrent requests from several plots
// mounting at once share a single decode. The decoded blobs are large binary
// data, so they live here rather than in the redux store.
const imageCache = new Map();
const bitmaskCache = new Map();

// Synchronously-readable caches of the RESOLVED values, so a remounting plot (e.g.
// switching between Data Processing steps) can initialise its state immediately
// instead of waiting on the async chain (signed-URL fetch → decode) and flashing a
// spinner before redrawing.
const imageResolvedCache = new Map();
const bitmaskResolvedCache = new Map();

export const peekFullImage = (cacheKey) => imageResolvedCache.get(cacheKey) || null;
export const peekBitmask = (cacheKey) => bitmaskResolvedCache.get(cacheKey) || null;

/**
 * Full-resolution (level-0) histology image for a sample, cached by key.
 * @returns {Promise<{ imageUrl, imageWidth, imageHeight, imageExtent } | null>}
 */
export const loadFullImage = (omeZarrUrl, cacheKey) => {
  if (!imageCache.has(cacheKey)) {
    const promise = (async () => {
      const dims = await getImageDimensions(omeZarrUrl);
      if (!dims) return null;
      // request the full extent at full output size → forces the level-0 tile
      return getImageUrls(omeZarrUrl, {
        xMin: 0,
        xMax: dims.imageWidth,
        yMin: 0,
        yMax: dims.imageHeight,
        outputWidth: dims.imageWidth,
        outputHeight: dims.imageHeight,
      });
    })();
    // drop failed loads from the cache so they can be retried
    promise.catch(() => imageCache.delete(cacheKey));
    promise.then((value) => { if (value) imageResolvedCache.set(cacheKey, value); });
    imageCache.set(cacheKey, promise);
  }
  return imageCache.get(cacheKey);
};

/**
 * Full-resolution (level-0) segmentation label bitmask for a sample, cached by
 * key. The (cheap) per-view colouring is applied separately via
 * colorSegmentationOverlay.
 * @returns {Promise<{ flatData, regionW, regionH, extent } | null>}
 */
export const loadSegmentationBitmask = (omeZarrUrl, cacheKey) => {
  if (!bitmaskCache.has(cacheKey)) {
    const promise = decodeSegmentationBitmask(omeZarrUrl);
    promise.catch(() => bitmaskCache.delete(cacheKey));
    promise.then((value) => { if (value) bitmaskResolvedCache.set(cacheKey, value); });
    bitmaskCache.set(cacheKey, promise);
  }
  return bitmaskCache.get(cacheKey);
};

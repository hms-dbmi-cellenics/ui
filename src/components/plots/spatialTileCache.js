import { readImageTile } from './getImageUrls';
import { readSegTile, releaseOverlay } from './loadSegmentationOverlay';

// Cross-instance caches of streamed spatial TILES, keyed by a stable
// experiment+sample key + pyramid coordinates (level/tx/ty) — NOT the signed URL,
// which changes per request. So a tile fetched/decoded once is reused across every
// spatial plot and across remounts (no redraw, no flash). Tissue tiles cache the
// rendered canvas (shared, read-only); segmentation tiles cache the decoded labels
// (the per-cell colouring is applied per-plot by useSpatialStream).
//
// Both caches are LRU-capped by tile count; the visible set at any zoom is small
// (tens of tiles), so the cap mostly bounds history, not the working set.
const TILE_CACHE_MAX = 256;

const tileKey = (sampleKey, tile) => `${sampleKey}:${tile.level}:${tile.tx}:${tile.ty}`;

// in-flight promise dedup + resolved map for synchronous peek
const tissuePromises = new Map();
const tissueResolved = new Map();
const segPromises = new Map();
const segResolved = new Map();

const touch = (map, key) => {
  // refresh LRU position
  if (map.has(key)) {
    const v = map.get(key);
    map.delete(key);
    map.set(key, v);
  }
};

const evict = (resolved, promises, releaseFn) => {
  while (resolved.size > TILE_CACHE_MAX) {
    const oldest = resolved.keys().next().value;
    const entry = resolved.get(oldest);
    resolved.delete(oldest);
    promises.delete(oldest);
    if (releaseFn && entry) releaseFn(entry);
  }
};

export const peekTissueTile = (sampleKey, tile) => {
  const key = tileKey(sampleKey, tile);
  if (!tissueResolved.has(key)) return null;
  touch(tissueResolved, key);
  return tissueResolved.get(key);
};

export const peekSegTile = (sampleKey, tile) => {
  const key = tileKey(sampleKey, tile);
  if (!segResolved.has(key)) return null;
  touch(segResolved, key);
  return segResolved.get(key);
};

/**
 * Rendered histology tile { url, extent } for one pyramid tile, cached by key.
 * @returns {Promise<{ url, extent } | null>}
 */
export const loadTissueTile = (pyramid, sampleKey, tile) => {
  const key = tileKey(sampleKey, tile);
  if (!tissuePromises.has(key)) {
    const promise = readImageTile(pyramid, tile);
    promise.catch(() => tissuePromises.delete(key));
    promise.then((value) => {
      if (!value) { tissuePromises.delete(key); return; }
      tissueResolved.set(key, value);
      evict(tissueResolved, tissuePromises, (e) => releaseOverlay(e.url));
    });
    tissuePromises.set(key, promise);
  }
  return tissuePromises.get(key);
};

/**
 * Decoded segmentation-label tile { flatData, regionW, regionH, extent } for one
 * pyramid tile, cached by key. Colouring is applied per-plot.
 * @returns {Promise<{ flatData, regionW, regionH, extent } | null>}
 */
export const loadSegTile = (pyramid, sampleKey, tile) => {
  const key = tileKey(sampleKey, tile);
  if (!segPromises.has(key)) {
    const promise = readSegTile(pyramid, tile);
    promise.catch(() => segPromises.delete(key));
    promise.then((value) => {
      if (!value) { segPromises.delete(key); return; }
      segResolved.set(key, value);
      evict(segResolved, segPromises, null);
    });
    segPromises.set(key, promise);
  }
  return segPromises.get(key);
};

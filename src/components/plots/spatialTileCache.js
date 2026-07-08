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

// ── Global request scheduler ────────────────────────────────────────────────
// Caps how many tiles decode concurrently (across ALL spatial plots) and — like
// viv's request scheduler — drops requests that are no longer wanted BEFORE they
// start, so sweeping through zoom levels on a fast zoom doesn't pile up decodes of
// tiles you've already zoomed past. Each job carries an isWanted() predicate (re-
// checked at start time, reading the caller's live "currently-visible" set) and a
// priority (higher first, e.g. target level over coarse fallback).
const MAX_CONCURRENT_TILE_LOADS = 6;
let activeLoads = 0;
const pendingJobs = [];

const runJob = (job) => {
  activeLoads += 1;
  Promise.resolve()
    .then(() => job.run())
    .then((v) => job.resolve(v), () => job.resolve(null))
    .finally(() => { activeLoads -= 1; pump(); }); // eslint-disable-line no-use-before-define
};

const pump = () => {
  if (pendingJobs.length > 1) pendingJobs.sort((a, b) => b.priority - a.priority);
  while (activeLoads < MAX_CONCURRENT_TILE_LOADS && pendingJobs.length) {
    const job = pendingJobs.shift();
    if (job.isWanted && !job.isWanted()) {
      job.resolve(null); // superseded before it started → skip (caller may re-request)
    } else {
      runJob(job);
    }
  }
};

const schedule = (run, { isWanted = null, priority = 0 } = {}) => new Promise((resolve) => {
  pendingJobs.push({
    run, isWanted, priority, resolve,
  });
  pump();
});

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
 * The decode is gated by the global scheduler; a value of null means it failed or
 * was skipped (superseded before starting) — callers should treat that as "retry
 * later" and not cache it.
 * @param {object} opts  { isWanted, priority } for the scheduler
 * @returns {Promise<{ url, extent } | null>}
 */
export const loadTissueTile = (pyramid, sampleKey, tile, opts = {}) => {
  const key = tileKey(sampleKey, tile);
  if (!tissuePromises.has(key)) {
    const promise = schedule(() => readImageTile(pyramid, tile), opts);
    promise.catch(() => tissuePromises.delete(key));
    promise.then((value) => {
      if (!value) { tissuePromises.delete(key); return; } // skipped/failed → re-requestable
      tissueResolved.set(key, value);
      evict(tissueResolved, tissuePromises, (e) => releaseOverlay(e.url));
    });
    tissuePromises.set(key, promise);
  }
  return tissuePromises.get(key);
};

/**
 * Decoded segmentation-label tile { flatData, regionW, regionH, extent } for one
 * pyramid tile, cached by key. Colouring is applied per-plot. Scheduler-gated like
 * loadTissueTile (null = skipped/failed → re-requestable).
 * @param {object} opts  { isWanted, priority } for the scheduler
 * @returns {Promise<{ flatData, regionW, regionH, extent } | null>}
 */
export const loadSegTile = (pyramid, sampleKey, tile, opts = {}) => {
  const key = tileKey(sampleKey, tile);
  if (!segPromises.has(key)) {
    const promise = schedule(() => readSegTile(pyramid, tile), opts);
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

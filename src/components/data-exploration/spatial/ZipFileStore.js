/* eslint-disable */
// adapted from @zarrita/storage so that GET is used instead of HEAD (presigned urls need to be different based on method)
import { unzip } from "unzipit";
import sharedRequest, { newRequestStats, requestStats } from "./sharedRequest";

function strip_prefix(path) {
  return path.slice(1);
}

// ── Download stats ──────────────────────────────────────────────────────────
// Per-zip accounting of what was actually fetched vs the zip's full size, to check
// range reads in a real session. Run `spatialZipStats()` in the browser console
// for a table; `spatialZipStats({ reset: true })` zeroes the counters (keeping each
// zip's mode and size, since already-open stores won't re-register them).
// Also counts what tile cancellation saved: range reads aborted mid-flight and
// the bytes they had asked for, plus url re-signs after a signature expired.
const zipStats = new Map();

const describeUrl = (href) => {
  try {
    const { hostname, pathname } = new URL(href);
    // bucket name says the file kind (spatial-images / -segmentations / -molecules)
    return `${hostname.split('.')[0]}${decodeURIComponent(pathname)}`;
  } catch (e) {
    return String(href);
  }
};

const statsFor = (href) => {
  let stats = zipStats.get(href);
  if (!stats) {
    stats = {
      file: describeUrl(href),
      mode: null,
      zipBytes: null,
      fetchedBytes: 0,
      requests: 0,
      chunkReads: 0,
      chunkCacheHits: 0,
      abortedRequests: 0,
      abortedBytes: 0,
      urlRefreshes: 0,
      chunkLoads: newRequestStats(),
    };
    zipStats.set(href, stats);
  }
  return stats;
};

const countFetch = (href, bytes) => {
  const stats = statsFor(href);
  stats.requests += 1;
  stats.fetchedBytes += bytes;
};

const toMB = (bytes) => (bytes == null ? null : Number((bytes / 1e6).toFixed(2)));

export const spatialZipStats = ({ reset = false } = {}) => {
  const tiles = requestStats('decodedTiles');
  const chunks = requestStats('decodedChunks');
  if (reset) {
    zipStats.forEach((stats) => {
      Object.assign(stats, {
        fetchedBytes: 0,
        requests: 0,
        chunkReads: 0,
        chunkCacheHits: 0,
        abortedRequests: 0,
        abortedBytes: 0,
        urlRefreshes: 0,
        chunkLoads: newRequestStats(),
      });
    });
    Object.assign(tiles, newRequestStats());
    Object.assign(chunks, newRequestStats());
    return undefined;
  }
  // only zips touched since the last reset
  const rows = [...zipStats.values()]
    .filter((s) => s.chunkReads || s.requests || s.abortedRequests)
    .map((s) => ({
      file: s.file,
      mode: s.mode,
      zipMB: toMB(s.zipBytes),
      fetchedMB: toMB(s.fetchedBytes),
      fetchedPct: s.zipBytes ? Number(((100 * s.fetchedBytes) / s.zipBytes).toFixed(1)) : null,
      requests: s.requests,
      chunkReads: s.chunkReads,
      chunkCacheHits: s.chunkCacheHits,
      // chunk reads whose tile was cancelled; some of them aborted a download,
      // the rest kept going because another layer still needed the chunk
      cancelledReads: s.chunkLoads.cancelled,
      abortedRequests: s.abortedRequests,
      // what the aborted range reads had asked for — an upper bound on the bytes
      // saved, since one aborted mid-transfer may have received part of it
      abortedMB: toMB(s.abortedBytes),
      urlRefreshes: s.urlRefreshes,
    }));
  const sum = (key) => rows.reduce((n, r) => n + (r[key] ?? 0), 0);
  console.table(rows);
  console.info(`[ZipFileStore] fetched ${sum('fetchedMB').toFixed(2)} MB of ${sum('zipMB').toFixed(2)} MB across ${rows.length} zips; ${sum('chunkCacheHits')}/${sum('chunkReads')} chunk reads served from cache`);
  console.info(`[ZipFileStore] cancelled tiles: ${sum('cancelledReads')} chunk reads cancelled, ${sum('abortedRequests')} downloads aborted (≤ ${sum('abortedMB').toFixed(2)} MB not downloaded); ${sum('urlRefreshes')} expired urls re-signed`);
  console.info(`[ZipFileStore] Data Exploration decoded tiles: ${tiles.started} read + decoded; reused instead of decoded again: ${tiles.joined} while in flight, ${tiles.reused} already finished; ${tiles.cancelled} cancelled, ${tiles.aborted} aborted (download stopped as no layer still wanted it)`);
  console.info(`[ZipFileStore] Vega plots' decoded chunks: ${chunks.started} decoded; reused instead of decoded again: ${chunks.joined} while in flight, ${chunks.reused} already decoded`);
  return rows;
};

if (typeof window !== 'undefined') window.spatialZipStats = spatialZipStats;

function fetch_range(url, offset, length, opts = {}) {
  if (offset !== undefined && length !== undefined) {
    // merge request opts
    opts = {
      ...opts,
      headers: {
        ...opts.headers,
        Range: `bytes=${offset}-${offset + length - 1}`,
      },
    };
  }
  return fetch(url, opts);
}

class BlobReader {
  blob;
  constructor(blob) {
    this.blob = blob;
  }
  async getLength() {
    return this.blob.size;
  }
  async read(offset, length) {
    const blob = this.blob.slice(offset, offset + length);
    return new Uint8Array(await blob.arrayBuffer());
  }
}

// ── Signed url refresh ──────────────────────────────────────────────────────
// The API signs urls with temporary (STS) credentials, so a "24h" url stops
// working as soon as that session token expires — S3 then answers 400
// ExpiredToken (or 403). getSampleFileUrls registers how to re-sign each url; a
// reader that hits an expired url re-signs it once and retries.
const refreshers = new Map();
const REFRESHERS_MAX = 256;
const isExpiredUrlStatus = (status) => status === 400 || status === 403;

class HTTPRangeReader {
  url;
  length;
  constructor(url) {
    // `url` identifies the zip (cache keys, stats); `signedUrl` is what's fetched
    // and is replaced when the signature expires
    this.url = url;
    this.signedUrl = url;
    this.refreshing = null;
  }
  // Re-sign once per expiry: concurrent reads that failed on the same stale url
  // share one refresh, and reads that started before it just retry the new url.
  refresh(staleUrl) {
    if (this.signedUrl !== staleUrl) return Promise.resolve(this.signedUrl);
    if (!this.refreshing) {
      const refresher = refreshers.get(this.url);
      if (!refresher) return Promise.resolve(null);
      const stats = statsFor(this.url);
      this.refreshing = refresher()
        .then((fresh) => {
          if (fresh) {
            this.signedUrl = fresh;
            stats.urlRefreshes += 1;
            console.info(`[ZipFileStore] signed url expired, re-signed: ${stats.file}`);
          } else {
            console.warn(`[ZipFileStore] signed url expired and the file has no new url: ${stats.file}`);
          }
          return fresh;
        })
        .catch((e) => {
          console.warn(`[ZipFileStore] signed url expired and re-signing failed: ${stats.file}`, e);
          return null;
        })
        .finally(() => { this.refreshing = null; });
    }
    return this.refreshing;
  }
  async fetch(offset, length, opts) {
    const signed = this.signedUrl;
    const req = await fetch_range(signed, offset, length, opts);
    if (!isExpiredUrlStatus(req.status)) return req;
    const fresh = await this.refresh(signed);
    return fresh ? fetch_range(fresh, offset, length, opts) : req;
  }
  async getLength() {
    if (this.length === undefined) {

      // const req = await fetch(this.url, { method: "HEAD" });
      // use GET to request headers only (first byte)
      const req = await this.fetch(0, 1);

      if (!req.ok) {
        throw new Error(`failed http request ${this.url}, status: ${req.status}: ${req.statusText}`);
      }
      this.length = parseInt(req.headers.get("content-length"));
      if (Number.isNaN(this.length)) {
        throw Error("could not get length");
      }
    }
    return this.length;
  }
  async read(offset, size, signal) {
    if (size === 0) {
      return new Uint8Array(0);
    }
    let bytes;
    try {
      const req = await this.fetch(offset, size, { signal });
      if (!req.ok) {
        throw new Error(`failed http request ${this.url}, status: ${req.status} offset: ${offset} size: ${size}: ${req.statusText}`);
      }
      bytes = new Uint8Array(await req.arrayBuffer());
    } catch (e) {
      if (signal?.aborted) {
        const stats = statsFor(this.url);
        stats.abortedRequests += 1;
        stats.abortedBytes += size;
      }
      throw e;
    }
    countFetch(this.url, bytes.byteLength);
    return bytes;
  }
}
// ── Known zip sizes ─────────────────────────────────────────────────────────
// S3 doesn't expose Content-Range to the browser, so a range reader can't learn
// the zip's total length itself. getSampleFileUrls registers the size the API
// returns alongside each signed url; with it, the store range-reads only the
// central directory + the chunks actually requested. Without it, it falls back to
// unzip(url), which downloads the whole zip into a blob.
const knownSizes = new Map();
const KNOWN_SIZES_MAX = 256;

// ── Store cache ─────────────────────────────────────────────────────────────
// One store per url (LRU) so remounts reuse the already-read central directory.
// Range-read stores hold only that directory; whole-zip fallback stores hold the
// full file, so keep the cap near image + segmentation + molecules per sample.
const storeCache = new Map();
const STORE_CACHE_MAX = 16;

// ── Chunk cache ─────────────────────────────────────────────────────────────
// Raw entry bytes from range-read stores, LRU-capped by total bytes and shared
// by every reader (viv layers in Data Exploration, the Vega spatial plots). Also
// dedups concurrent requests for the same entry (e.g. the fill / outline / hover
// segmentation layers asking for the same tile). Callers must not mutate the
// returned bytes — zarr decodes them into new arrays.
const chunkCache = new Map();
const chunkInflight = new Map();
let chunkCacheBytes = 0;
const CHUNK_CACHE_MAX_BYTES = 256 * 1024 * 1024;

// `load(signal)` is aborted once every caller waiting on it has aborted (see
// sharedRequest), e.g. when deck.gl drops the tiles that needed this chunk.
const getCachedChunk = (key, load, onHit, signal, loadStats) => {
  const hit = chunkCache.get(key);
  if (hit) {
    onHit();
    chunkCache.delete(key);
    chunkCache.set(key, hit);
    return Promise.resolve(hit);
  }
  if (chunkInflight.has(key)) onHit();

  return sharedRequest(chunkInflight, key, (loadSignal) => load(loadSignal).then((bytes) => {
    if (bytes && bytes.byteLength <= CHUNK_CACHE_MAX_BYTES) {
      chunkCache.set(key, bytes);
      chunkCacheBytes += bytes.byteLength;
      while (chunkCacheBytes > CHUNK_CACHE_MAX_BYTES) {
        const oldest = chunkCache.keys().next().value;
        chunkCacheBytes -= chunkCache.get(oldest).byteLength;
        chunkCache.delete(oldest);
      }
    }
    return bytes;
  }), signal, loadStats);
};

// Local file header is 30 bytes + name + extra field. The extra field isn't in
// the central directory (and can differ from its copy there), so over-read by this
// much to get header + data in ONE request; Info-ZIP writes ~28 bytes here.
const LOCAL_EXTRA_SLACK = 128;
const LOCAL_HEADER_SIGNATURE = 0x04034b50;

/** @experimental */
class ZipFileStore {
  info;
  constructor(reader) {
    this.reader = reader;
    // range-read when the length is known up front (or for in-memory blobs);
    // otherwise unzip(url) downloads the whole zip
    this.ranged = reader instanceof HTTPRangeReader && reader.length !== undefined;
    if (this.ranged) {
      const stats = statsFor(reader.url);
      stats.mode = 'range';
      stats.zipBytes = reader.length;
      this.info = unzip(reader);
    } else if (reader.url) {
      this.info = ZipFileStore.downloadWhole(reader).then((blob) => unzip(new BlobReader(blob)));
    } else {
      this.info = unzip(reader);
    }
  }
  // Same as unzip(url) (one GET of the whole file), but counted in the stats.
  static async downloadWhole(reader) {
    const href = reader.url;
    const stats = statsFor(href);
    stats.mode = 'whole';
    const req = await reader.fetch();
    if (!req.ok) {
      throw new Error(`failed http request ${href}, status: ${req.status}: ${req.statusText}`);
    }
    const blob = await req.blob();
    stats.zipBytes = blob.size;
    countFetch(href, blob.size);
    return blob;
  }
  // `opts.signal` (zarrita passes the store options through) aborts a range read
  // that's no longer needed.
  async get(key, opts) {
    const path = strip_prefix(key);
    let entry = (await this.info).entries[path];
    if (!entry)
      return;
    if (this.reader.url) statsFor(this.reader.url).chunkReads += 1;
    if (!this.ranged) return new Uint8Array(await entry.arrayBuffer());
    const stats = statsFor(this.reader.url);
    return getCachedChunk(
      `${this.reader.url}|${path}`,
      (signal) => this.readEntry(entry, signal),
      () => { stats.chunkCacheHits += 1; },
      opts?.signal,
      stats.chunkLoads,
    );
  }
  // Read a stored (uncompressed) entry's header + data in a single range request.
  // unzipit's entry.arrayBuffer() reads the 30-byte local header first and the
  // data second — two sequential round trips per chunk.
  async readEntry(entry, signal) {
    const raw = entry._rawEntry;
    if (raw.compressionMethod !== 0 || (raw.generalPurposeBitFlag & 0x1)) {
      return new Uint8Array(await entry.arrayBuffer());
    }
    const start = raw.relativeOffsetOfLocalHeader;
    const guess = 30 + raw.nameBytes.length + LOCAL_EXTRA_SLACK + raw.compressedSize;
    const buf = await this.reader.read(start, Math.min(guess, this.reader.length - start), signal);
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    if (view.getUint32(0, true) !== LOCAL_HEADER_SIGNATURE) {
      throw new Error(`invalid local file header signature for ${raw.name}`);
    }
    const dataStart = 30 + view.getUint16(26, true) + view.getUint16(28, true);
    if (dataStart + raw.compressedSize > buf.length) {
      // extra field larger than the slack — fall back to unzipit's two reads
      return new Uint8Array(await entry.arrayBuffer());
    }
    return buf.slice(dataStart, dataStart + raw.compressedSize);
  }
  async has(key) {
    return strip_prefix(key) in (await this.info).entries;
  }
  // Record a zip's byte size (from the downloadUrl response) so fromUrl can
  // range-read it.
  static registerSize(href, rawSize) {
    // sample_file.size is BIGINT, which the API serialises as a string
    const size = Number(rawSize);
    if (!href || !Number.isFinite(size) || size <= 0) return;
    knownSizes.delete(href);
    knownSizes.set(href, size);
    while (knownSizes.size > KNOWN_SIZES_MAX) {
      knownSizes.delete(knownSizes.keys().next().value);
    }
  }
  // Record how to get a freshly signed url for a zip once its signature expires.
  // `refresh` resolves to the new url (or null).
  static registerRefresher(href, refresh) {
    if (!href || typeof refresh !== 'function') return;
    refreshers.delete(href);
    refreshers.set(href, refresh);
    while (refreshers.size > REFRESHERS_MAX) {
      refreshers.delete(refreshers.keys().next().value);
    }
  }
  // Cached per url (LRU). A store whose zip failed to open is dropped so the next
  // call retries.
  static fromUrl(href) {
    let store = storeCache.get(href);
    if (store) {
      storeCache.delete(href);
      storeCache.set(href, store);
      return store;
    }
    const reader = new HTTPRangeReader(href);
    if (knownSizes.has(href)) reader.length = knownSizes.get(href);
    store = new ZipFileStore(reader);
    store.info.catch(() => { if (storeCache.get(href) === store) storeCache.delete(href); });
    storeCache.set(href, store);
    while (storeCache.size > STORE_CACHE_MAX) {
      storeCache.delete(storeCache.keys().next().value);
    }
    return store;
  }
  static clearCache() {
    storeCache.clear();
    knownSizes.clear();
    refreshers.clear();
    chunkCache.clear();
    chunkInflight.clear();
    chunkCacheBytes = 0;
  }
  static fromBlob(blob) {
    return new ZipFileStore(new BlobReader(blob));
  }
}

export default ZipFileStore;

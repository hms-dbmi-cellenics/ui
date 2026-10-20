import ZipFileStore, { spatialZipStats } from 'components/data-exploration/spatial/ZipFileStore';

// Minimal stored (uncompressed) zip writer — enough for unzipit to parse.
// `localExtra` bytes are added to each LOCAL header only, like Info-ZIP does.
const buildStoredZip = (files, localExtra = 0) => {
  const enc = new TextEncoder();
  const parts = [];
  const central = [];
  let offset = 0;

  Object.entries(files).forEach(([name, data]) => {
    const nameBytes = enc.encode(name);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 10, true);
    local.setUint32(18, data.length, true);
    local.setUint32(22, data.length, true);
    local.setUint16(26, nameBytes.length, true);
    local.setUint16(28, localExtra, true);
    parts.push(new Uint8Array(local.buffer), nameBytes, new Uint8Array(localExtra), data);

    const cd = new DataView(new ArrayBuffer(46));
    cd.setUint32(0, 0x02014b50, true);
    cd.setUint16(4, 20, true);
    cd.setUint16(6, 10, true);
    cd.setUint32(20, data.length, true);
    cd.setUint32(24, data.length, true);
    cd.setUint16(28, nameBytes.length, true);
    cd.setUint32(42, offset, true);
    central.push(new Uint8Array(cd.buffer), nameBytes);

    offset += 30 + nameBytes.length + localExtra + data.length;
  });

  const cdSize = central.reduce((n, p) => n + p.length, 0);
  const eocd = new DataView(new ArrayBuffer(22));
  eocd.setUint32(0, 0x06054b50, true);
  eocd.setUint16(8, Object.keys(files).length, true);
  eocd.setUint16(10, Object.keys(files).length, true);
  eocd.setUint32(12, cdSize, true);
  eocd.setUint32(16, offset, true);

  const all = [...parts, ...central, new Uint8Array(eocd.buffer)];
  const out = new Uint8Array(all.reduce((n, p) => n + p.length, 0));
  let pos = 0;
  all.forEach((p) => { out.set(p, pos); pos += p.length; });
  return out;
};

// fetch that serves byte ranges of `zip` and records each request. Urls in
// `expiredUrls` answer 400, like S3 for a url signed with an expired token.
const mockRangeFetch = (zip, expiredUrls = []) => jest.fn(async (url, opts = {}) => {
  if (expiredUrls.includes(url)) {
    return { ok: false, status: 400, statusText: 'Bad Request' };
  }
  const range = opts.headers?.Range;
  if (!range) {
    // jsdom's Blob has no arrayBuffer(), so hand back a minimal blob-like
    const blob = {
      size: zip.length,
      slice: (from, to) => ({ arrayBuffer: async () => zip.slice(from, to).buffer }),
    };
    return { ok: true, status: 200, blob: async () => blob };
  }
  const [, from, to] = range.match(/bytes=(\d+)-(\d+)/).map(Number);
  const body = zip.slice(from, Math.min(to + 1, zip.length));
  return { ok: true, status: 206, arrayBuffer: async () => body.buffer };
});

const bytes = (...values) => Uint8Array.from(values);

describe('ZipFileStore range reads', () => {
  const url = 'https://example.com/signed.zip';
  const files = {
    '0/.zarray': bytes(1, 2, 3),
    '0/0/0/0': bytes(9, 8, 7, 6, 5),
  };

  beforeEach(() => {
    ZipFileStore.clearCache();
    spatialZipStats({ reset: true });
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'table').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('Reads each entry with a single range request once the size is known', async () => {
    const zip = buildStoredZip(files, 28);
    global.fetch = mockRangeFetch(zip);
    ZipFileStore.registerSize(url, zip.length);

    const store = ZipFileStore.fromUrl(url);
    await store.info;
    const afterDirectory = global.fetch.mock.calls.length;

    expect(await store.get('/0/0/0/0')).toEqual(files['0/0/0/0']);
    expect(global.fetch.mock.calls.length - afterDirectory).toEqual(1);
    // never downloads the whole file
    global.fetch.mock.calls.forEach(([, opts]) => expect(opts?.headers?.Range).toBeDefined());
  });

  it('Accepts sizes serialised as strings (BIGINT column)', async () => {
    const zip = buildStoredZip(files);
    global.fetch = mockRangeFetch(zip);
    ZipFileStore.registerSize(url, String(zip.length));

    const store = ZipFileStore.fromUrl(url);
    expect(await store.get('/0/0/0/0')).toEqual(files['0/0/0/0']);
    global.fetch.mock.calls.forEach(([, opts]) => expect(opts?.headers?.Range).toBeDefined());
  });

  it('Serves repeat and concurrent reads from the chunk cache', async () => {
    const zip = buildStoredZip(files);
    global.fetch = mockRangeFetch(zip);
    ZipFileStore.registerSize(url, zip.length);

    const store = ZipFileStore.fromUrl(url);
    await store.info;
    const afterDirectory = global.fetch.mock.calls.length;

    const [a, b] = await Promise.all([store.get('/0/0/0/0'), store.get('/0/0/0/0')]);
    await store.get('/0/0/0/0');

    expect(a).toEqual(files['0/0/0/0']);
    expect(b).toBe(a);
    expect(global.fetch.mock.calls.length - afterDirectory).toEqual(1);
  });

  it('Falls back to a second read when the local extra field exceeds the slack', async () => {
    const zip = buildStoredZip(files, 400);
    global.fetch = mockRangeFetch(zip);
    ZipFileStore.registerSize(url, zip.length);

    const store = ZipFileStore.fromUrl(url);
    expect(await store.get('/0/.zarray')).toEqual(files['0/.zarray']);
  });

  it('Returns undefined for missing entries', async () => {
    const zip = buildStoredZip(files);
    global.fetch = mockRangeFetch(zip);
    ZipFileStore.registerSize(url, zip.length);

    expect(await ZipFileStore.fromUrl(url).get('/missing')).toBeUndefined();
  });

  it('Downloads the whole zip when the size is unknown', async () => {
    const zip = buildStoredZip(files);
    global.fetch = mockRangeFetch(zip);

    const store = ZipFileStore.fromUrl(url);
    expect(await store.get('/0/0/0/0')).toEqual(files['0/0/0/0']);
    expect(global.fetch.mock.calls[0][1]?.headers?.Range).toBeUndefined();
  });

  it('Reports range-read downloads as a fraction of the zip', async () => {
    // larger than unzipit's ~64KB tail read, so a partial read is visible
    const big = new Uint8Array(300000);
    const zip = buildStoredZip({ ...files, '0/1/0/0': big });
    global.fetch = mockRangeFetch(zip);
    ZipFileStore.registerSize(url, zip.length);

    const store = ZipFileStore.fromUrl(url);
    await store.get('/0/0/0/0');
    await store.get('/0/0/0/0');

    const [row] = spatialZipStats();
    expect(row.mode).toEqual('range');
    expect(row.zipMB).toEqual(Number((zip.length / 1e6).toFixed(2)));
    expect(row.fetchedPct).toBeLessThan(100);
    expect(row.chunkReads).toEqual(2);
    expect(row.chunkCacheHits).toEqual(1);
    expect(row.requests).toEqual(global.fetch.mock.calls.length);
  });

  it('Reports whole-zip downloads as the full file', async () => {
    const zip = buildStoredZip(files);
    global.fetch = mockRangeFetch(zip);

    await ZipFileStore.fromUrl(url).get('/0/0/0/0');

    const [row] = spatialZipStats();
    expect(row.mode).toEqual('whole');
    expect(row.fetchedPct).toEqual(100);
    expect(row.requests).toEqual(1);
  });

  it('Reset zeroes counters but keeps each zip mode and size', async () => {
    const zip = buildStoredZip(files);
    global.fetch = mockRangeFetch(zip);
    ZipFileStore.registerSize(url, zip.length);

    const store = ZipFileStore.fromUrl(url);
    await store.get('/0/0/0/0');
    spatialZipStats({ reset: true });
    expect(spatialZipStats()).toEqual([]);

    await store.get('/0/0/0/0');
    const [row] = spatialZipStats();
    expect(row.mode).toEqual('range');
    expect(row.zipMB).not.toBeNull();
    expect(row.fetchedMB).toEqual(0);
    expect(row.chunkCacheHits).toEqual(1);
  });

  it('Re-signs an expired url once and keeps reading through the same store', async () => {
    const freshUrl = 'https://example.com/re-signed.zip';
    const zip = buildStoredZip(files);
    global.fetch = mockRangeFetch(zip);
    ZipFileStore.registerSize(url, zip.length);
    const refresh = jest.fn(async () => freshUrl);
    ZipFileStore.registerRefresher(url, refresh);

    const store = ZipFileStore.fromUrl(url);
    await store.info;

    // the signature expires mid-session
    global.fetch = mockRangeFetch(zip, [url]);
    const [a, b] = await Promise.all([store.get('/0/0/0/0'), store.get('/0/.zarray')]);

    expect(a).toEqual(files['0/0/0/0']);
    expect(b).toEqual(files['0/.zarray']);
    // concurrent failures share one re-sign; each read retries the new url once
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(global.fetch.mock.calls.map(([u]) => u)).toEqual([url, url, freshUrl, freshUrl]);
    // the store keeps its original cache key
    expect(ZipFileStore.fromUrl(url)).toBe(store);
  });

  it('Fails with the original error when the url cannot be re-signed', async () => {
    const zip = buildStoredZip(files);
    global.fetch = mockRangeFetch(zip);
    ZipFileStore.registerSize(url, zip.length);

    const store = ZipFileStore.fromUrl(url);
    await store.info;
    global.fetch = mockRangeFetch(zip, [url]);

    await expect(store.get('/0/0/0/0')).rejects.toThrow('status: 400');
  });

  it('Re-signs an expired url for whole-zip downloads too', async () => {
    const freshUrl = 'https://example.com/re-signed.zip';
    const zip = buildStoredZip(files);
    global.fetch = mockRangeFetch(zip, [url]);
    ZipFileStore.registerRefresher(url, async () => freshUrl);

    expect(await ZipFileStore.fromUrl(url).get('/0/0/0/0')).toEqual(files['0/0/0/0']);
    expect(global.fetch.mock.calls.map(([u]) => u)).toEqual([url, freshUrl]);
  });

  it('Aborts the range read once every reader of a chunk has aborted', async () => {
    const zip = buildStoredZip(files);
    global.fetch = mockRangeFetch(zip);
    ZipFileStore.registerSize(url, zip.length);
    const store = ZipFileStore.fromUrl(url);
    await store.info;

    let fetchSignal;
    global.fetch = jest.fn((u, opts) => {
      fetchSignal = opts.signal;
      return new Promise(() => {}); // never answers
    });

    const first = new AbortController();
    const second = new AbortController();
    const a = store.get('/0/0/0/0', { signal: first.signal });
    const b = store.get('/0/0/0/0', { signal: second.signal });
    await new Promise((resolve) => { setTimeout(resolve, 0); });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    first.abort();
    await expect(a).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetchSignal.aborted).toBe(false);

    second.abort();
    await expect(b).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetchSignal.aborted).toBe(true);
  });

  it('Counts cancelled reads, aborted downloads and their requested bytes', async () => {
    // big enough to show up in the MB columns
    const zip = buildStoredZip({ ...files, '0/0/0/0': new Uint8Array(50000) });
    global.fetch = mockRangeFetch(zip);
    ZipFileStore.registerSize(url, zip.length);
    const store = ZipFileStore.fromUrl(url);
    await store.info;
    spatialZipStats({ reset: true });

    // a fetch that only settles by aborting, like a real one
    global.fetch = jest.fn((u, opts) => new Promise((resolve, reject) => {
      opts.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
    }));

    const first = new AbortController();
    const second = new AbortController();
    const a = store.get('/0/0/0/0', { signal: first.signal });
    const b = store.get('/0/0/0/0', { signal: second.signal });
    await new Promise((resolve) => { setTimeout(resolve, 0); });
    first.abort();
    second.abort();
    await expect(a).rejects.toMatchObject({ name: 'AbortError' });
    await expect(b).rejects.toMatchObject({ name: 'AbortError' });
    await new Promise((resolve) => { setTimeout(resolve, 0); });

    const [row] = spatialZipStats();
    expect(row.cancelledReads).toEqual(2);
    expect(row.abortedRequests).toEqual(1);
    expect(row.abortedMB).toEqual(0.05);
    expect(row.requests).toEqual(0);
  });
});

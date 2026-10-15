import ZipFileStore from 'components/data-exploration/spatial/ZipFileStore';

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

// fetch that serves byte ranges of `zip` and records each request
const mockRangeFetch = (zip) => jest.fn(async (url, opts = {}) => {
  const range = opts.headers?.Range;
  if (!range) {
    return { ok: true, status: 200, blob: async () => new Blob([zip]) };
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
});

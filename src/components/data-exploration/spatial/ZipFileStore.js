/* eslint-disable */
// adapted from @zarrita/storage so that GET is used instead of HEAD (presigned urls need to be different based on method)
import { unzip } from "unzipit";

function strip_prefix(path) {
  return path.slice(1);
}

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

class HTTPRangeReader {
  url;
  length;
  constructor(url) {
    this.url = url;
  }
  async getLength() {
    if (this.length === undefined) {

      // const req = await fetch(this.url, { method: "HEAD" });
      // use GET to request headers only (first byte)
      const req = await fetch_range(this.url, 0, 1);

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
  async read(offset, size) {
    if (size === 0) {
      return new Uint8Array(0);
    }
    const req = await fetch_range(this.url, offset, size);
    if (!req.ok) {
      throw new Error(`failed http request ${this.url}, status: ${req.status} offset: ${offset} size: ${size}: ${req.statusText}`);
    }
    return new Uint8Array(await req.arrayBuffer());
  }
}
/** @experimental */
// class ZipFileStore {
//     info;
//     constructor(reader) {

//         this.info = unzip(reader.url);
//     }
//     async get(key) {
//         let entry = (await this.info).entries[strip_prefix(key)];
//         if (!entry)
//             return;
//         return new Uint8Array(await entry.arrayBuffer());
//     }
//     async has(key) {
//         return strip_prefix(key) in (await this.info).entries;
//     }
//     static fromUrl(href) {
//         return new ZipFileStore(new HTTPRangeReader(href));
//     }
//     static fromBlob(blob) {
//         return new ZipFileStore(new BlobReader(blob));
//     }
// }

// ZipFileStore.js — full replacement with pre-loading
import JSZip from 'jszip';

export class ZipFileStore {
  constructor() {
    this._fileCache = new Map();  // path → Uint8Array, populated once at load time
    this._ready = false;
  }

  // ── Static factories ───────────────────────────────────────────────────────

  static fromUrl(url) {
    const store = new ZipFileStore();
    // Start fetching immediately but don't block constructor
    store._loadPromise = fetch(url)
      .then(r => {
        if (!r.ok) throw new Error(`ZipFileStore: HTTP ${r.status} for ${url}`);
        console.log(`[ZipFileStore] downloading ${url}...`);
        return r.arrayBuffer();
      })
      .then(buffer => store._loadFromBuffer(buffer));
    return store;
  }

  static fromBuffer(buffer) {
    const store = new ZipFileStore();
    store._loadPromise = store._loadFromBuffer(buffer);
    return store;
  }

  // ── Internal: parse zip and cache ALL files as Uint8Arrays ────────────────
  async _loadFromBuffer(buffer) {
    const zip = await JSZip.loadAsync(buffer);
    const entries = Object.values(zip.files).filter(f => !f.dir);

    // Extract all files in parallel — happens once, results stay in memory
    await Promise.all(
      entries.map(async (entry) => {
        const data = await entry.async('uint8array');
        // Normalize path: strip leading slash or dot-slash
        const key = entry.name.replace(/^\.?\//, '');
        this._fileCache.set(key, data);
      })
    );

    this._ready = true;
    console.log(`[ZipFileStore] loaded ${this._fileCache.size} files into memory`);
    return this;
  }

  // ── zarrita Store interface ────────────────────────────────────────────────

  async get(key) {
    // Wait for zip to finish loading if called before ready
    if (!this._ready) await this._loadPromise;

    const normalizedKey = key.replace(/^\//, '');
    const data = this._fileCache.get(normalizedKey);

    if (!data) {
      // zarrita expects undefined (not an error) for missing keys
      return undefined;
    }
    return data;
  }

  async set(key, value) {
    throw new Error('ZipFileStore is read-only');
  }

  async has(key) {
    if (!this._ready) await this._loadPromise;
    return this._fileCache.has(key.replace(/^\//, ''));
  }

  async list(prefix = '') {
    if (!this._ready) await this._loadPromise;
    const p = prefix.replace(/^\//, '');
    return [...this._fileCache.keys()].filter(k => k.startsWith(p));
  }
}

export default ZipFileStore;

/* eslint-disable */
// adapted from @zarrita/storage so that GET is used instead of HEAD (presigned urls need to be different based on method)

import { unzip } from "unzipit";
import { fetch_range, strip_prefix } from "./util.js";
export class BlobReader {
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
export class HTTPRangeReader {
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
class ZipFileStore {
    info;
    constructor(reader) {

        this.info = unzip(reader.url);
    }
    async get(key) {
        let entry = (await this.info).entries[strip_prefix(key)];
        if (!entry)
            return;
        return new Uint8Array(await entry.arrayBuffer());
    }
    async has(key) {
        return strip_prefix(key) in (await this.info).entries;
    }
    static fromUrl(href) {
        return new ZipFileStore(new HTTPRangeReader(href));
    }
    static fromBlob(blob) {
        return new ZipFileStore(new BlobReader(blob));
    }
}
export default ZipFileStore;

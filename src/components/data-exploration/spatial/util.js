/* eslint-disable */
// from @zarrita/storage

export function strip_prefix(path) {
    return path.slice(1);
}
export function uri2href(url) {
    let [protocol, rest] = (typeof url === "string" ? url : url.href).split("://");
    if (protocol === "https" || protocol === "http") {
        return url;
    }
    if (protocol === "gc") {
        return `https://storage.googleapis.com/${rest}`;
    }
    if (protocol === "s3") {
        return `https://s3.amazonaws.com/${rest}`;
    }
    throw Error("Protocol not supported, got: " + JSON.stringify(protocol));
}
export function fetch_range(url, offset, length, opts = {}) {
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

/* eslint-disable no-param-reassign */ // `stats` counters are updated in place
// Dedup concurrent requests for the same key while still honouring each caller's
// AbortSignal. Every caller gets its own promise that rejects as soon as ITS
// signal aborts; the underlying load is aborted only once every caller waiting on
// it has gone. deck.gl aborts tiles that scroll/zoom out of view, so without this
// a stale tile's fetch keeps holding one of the browser's ~6 connections per S3
// host (and the TileLayer's request slot) ahead of the tiles now on screen.

const abortError = (signal) => signal?.reason ?? new DOMException('Aborted', 'AbortError');

// Counters for checking the dedup/abort behaviour in a real session (shown by
// spatialZipStats()): `started` loads, callers that `joined` one already in
// flight, callers `cancelled` by their signal, and loads `aborted` because every
// caller had cancelled. `reused` is for callers that also keep finished results.
const newRequestStats = () => ({
  started: 0, joined: 0, cancelled: 0, aborted: 0, reused: 0,
});

// Named stats for callers that don't keep their own (e.g. the decoded-tile dedup).
const namedStats = new Map();
const requestStats = (name) => {
  if (!namedStats.has(name)) namedStats.set(name, newRequestStats());
  return namedStats.get(name);
};

// `inflight` is a Map owned by the caller. `load(signal)` starts the shared request.
// `stats` (optional, from newRequestStats) is updated in place.
const sharedRequest = (inflight, key, load, signal, stats) => {
  if (signal?.aborted) {
    if (stats) stats.cancelled += 1;
    return Promise.reject(abortError(signal));
  }

  let entry = inflight.get(key);
  if (entry) {
    if (stats) stats.joined += 1;
  } else {
    if (stats) stats.started += 1;
    const controller = new AbortController();
    entry = { controller, waiters: 0, settled: false };
    entry.promise = load(controller.signal).finally(() => {
      entry.settled = true;
      if (inflight.get(key) === entry) inflight.delete(key);
    });
    // callers handle rejections through their own promises below
    entry.promise.catch(() => {});
    inflight.set(key, entry);
  }

  entry.waiters += 1;
  return new Promise((resolve, reject) => {
    let left = false;
    const leave = () => {
      if (left) return;
      left = true;
      entry.waiters -= 1;
      // eslint-disable-next-line no-use-before-define
      if (signal) signal.removeEventListener('abort', onAbort);
      if (entry.waiters === 0 && !entry.settled) {
        // drop it now so a new caller doesn't join an already-aborted request
        if (inflight.get(key) === entry) inflight.delete(key);
        if (stats) stats.aborted += 1;
        entry.controller.abort();
      }
    };
    const onAbort = () => {
      if (stats) stats.cancelled += 1;
      leave();
      reject(abortError(signal));
    };

    if (signal) signal.addEventListener('abort', onAbort, { once: true });
    entry.promise.then(
      (value) => { leave(); resolve(value); },
      (e) => { leave(); reject(e); },
    );
  });
};

export { newRequestStats, requestStats };
export default sharedRequest;

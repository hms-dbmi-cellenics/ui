import sharedRequest from 'components/data-exploration/spatial/sharedRequest';

// a load whose result the test settles by hand, recording the signal it got
const deferredLoad = () => {
  const load = jest.fn((signal) => new Promise((resolve, reject) => {
    load.resolve = resolve;
    load.reject = reject;
    load.signal = signal;
  }));
  return load;
};

describe('sharedRequest', () => {
  it('Shares one load between concurrent callers and drops it once settled', async () => {
    const inflight = new Map();
    const load = deferredLoad();

    const a = sharedRequest(inflight, 'k', load);
    const b = sharedRequest(inflight, 'k', load);
    load.resolve('bytes');

    await expect(a).resolves.toEqual('bytes');
    await expect(b).resolves.toEqual('bytes');
    expect(load).toHaveBeenCalledTimes(1);
    expect(inflight.size).toEqual(0);
  });

  it('Rejects an aborted caller without aborting the load others still wait on', async () => {
    const inflight = new Map();
    const load = deferredLoad();
    const controller = new AbortController();

    const aborted = sharedRequest(inflight, 'k', load, controller.signal);
    const kept = sharedRequest(inflight, 'k', load);
    controller.abort();

    await expect(aborted).rejects.toMatchObject({ name: 'AbortError' });
    expect(load.signal.aborted).toBe(false);

    load.resolve('bytes');
    await expect(kept).resolves.toEqual('bytes');
  });

  it('Aborts the load once every caller has aborted, and starts afresh after', async () => {
    const inflight = new Map();
    const load = deferredLoad();
    const first = new AbortController();
    const second = new AbortController();

    const a = sharedRequest(inflight, 'k', load, first.signal);
    const b = sharedRequest(inflight, 'k', load, second.signal);
    first.abort();
    second.abort();

    await expect(a).rejects.toMatchObject({ name: 'AbortError' });
    await expect(b).rejects.toMatchObject({ name: 'AbortError' });
    expect(load.signal.aborted).toBe(true);
    expect(inflight.size).toEqual(0);

    // a new caller doesn't join the aborted load
    const c = sharedRequest(inflight, 'k', load);
    expect(load).toHaveBeenCalledTimes(2);
    load.resolve('again');
    await expect(c).resolves.toEqual('again');
  });

  it('Rejects straight away for an already-aborted signal', async () => {
    const load = deferredLoad();
    const controller = new AbortController();
    controller.abort();

    await expect(sharedRequest(new Map(), 'k', load, controller.signal))
      .rejects.toMatchObject({ name: 'AbortError' });
    expect(load).not.toHaveBeenCalled();
  });

  it('Passes load failures to every caller', async () => {
    const inflight = new Map();
    const load = deferredLoad();

    const a = sharedRequest(inflight, 'k', load);
    const b = sharedRequest(inflight, 'k', load);
    load.reject(new Error('boom'));

    await expect(a).rejects.toThrow('boom');
    await expect(b).rejects.toThrow('boom');
    expect(inflight.size).toEqual(0);
  });
});

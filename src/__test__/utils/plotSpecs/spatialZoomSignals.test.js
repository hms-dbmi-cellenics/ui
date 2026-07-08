import spatialZoomSignals from 'utils/plotSpecs/spatialZoomSignals';

describe('spatialZoomSignals — interactive vs mini', () => {
  it('seeds xdom/ydom from the initial domains for mini previews (no handlers)', () => {
    const signals = spatialZoomSignals([1, 2], [3, 4], [0, 10], [0, 10], false);
    const byName = Object.fromEntries(signals.map((s) => [s.name, s]));
    expect(byName.xdom.value).toEqual([1, 2]);
    expect(byName.ydom.value).toEqual([3, 4]);
    // no wheel/drag handlers in the non-interactive variant
    expect(byName.xdom.on).toBeUndefined();
  });

  it('drives xdom off initXdom with wheel/drag handlers when interactive', () => {
    const signals = spatialZoomSignals([1, 2], [3, 4], [0, 10], [0, 10], true);
    const byName = Object.fromEntries(signals.map((s) => [s.name, s]));
    expect(byName.initXdom.value).toEqual([1, 2]);
    expect(byName.xdom.update).toBe('initXdom');
    expect(byName.xdom.on.length).toBeGreaterThan(0);
  });
});

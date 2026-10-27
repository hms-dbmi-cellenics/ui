import spatialCentroidSize from 'utils/plotSpecs/spatialCentroidSize';

// bins on a square grid, 10 units apart
const gridData = Array.from(
  { length: 100 }, (_, i) => ({ x: (i % 10) * 10, y: Math.floor(i / 10) * 10 }),
);

describe('spatialCentroidSize', () => {
  it('sizes dots to the cell spacing, following the zoom', () => {
    const { size } = spatialCentroidSize(gridData, 20);

    // radius of half the spacing (5 units), converted to pixels at the current zoom
    expect(size.signal).toEqual('max(1, PI * pow(5 * width / span(xdom), 2))');
  });

  it('scales the dot area with marker size', () => {
    const { size } = spatialCentroidSize(gridData, 80);

    expect(size.signal).toEqual('max(1, PI * pow(10 * width / span(xdom), 2))');
  });

  it('keeps outlines thinner than small dots', () => {
    const { strokeWidth } = spatialCentroidSize(gridData, 20);

    expect(strokeWidth.signal).toEqual('min(1, 0.5 * 5 * width / span(xdom))');
  });

  it('falls back to the fixed marker size when the spacing is unknown', () => {
    expect(spatialCentroidSize([{ x: 1, y: 1 }], 20)).toEqual({
      size: { value: 20 }, strokeWidth: { value: 1 },
    });
  });
});

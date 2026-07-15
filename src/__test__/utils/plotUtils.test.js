import { hexToRgb, convertRange, offsetCentroids } from 'utils/plotUtils';

describe('hexToRgb', () => {
  it('converts a hex to array of [r, g, b]', () => {
    const hex = '#5d2f86';
    const expectedRGB = [93, 47, 134];
    const res = hexToRgb(hex);
    expect(res).toEqual(expectedRGB);
  });

  it('returns null if hex is falsy', () => {
    const hex = '';
    const expectedRGB = null;
    const res = hexToRgb(hex);
    expect(res).toEqual(expectedRGB);
  });
});

describe('convertRange', () => {
  const values = [0, 0.5, 1];

  it('converts from one range to another', () => {
    const expectedOut = [0, 5, 10];
    const res = values.map((value) => convertRange(value, [0, 1], [0, 10]));
    expect(res).toEqual(expectedOut);
  });

  it('returns the original value if input range min and max are equal', () => {
    const res = values.map((value) => convertRange(value, [0, 0], [0, 10]));
    expect(res).toEqual(values);
  });
});

describe('offsetCentroids', () => {
  // Two samples laid out in a single row of two columns. perImageShape is
  // [height, width]; the second sample is shifted right by one image width.
  const sampleIds = ['sample-0', 'sample-1'];
  const properties = {
    'sample-0': { cellIds: new Set([0, 1]) },
    'sample-1': { cellIds: new Set([2, 3]) },
  };
  const perImageShape = [100, 200]; // [imageHeight, imageWidth]
  const gridShape = [1, 2]; // [rows, columns]

  it('applies the per-sample grid offset (column * width, row * height)', () => {
    const results = [];
    results[0] = [10, 20]; // sample-0, no offset
    results[2] = [5, 5]; // sample-1, shifted right by one image width

    const offset = offsetCentroids(results, properties, sampleIds, perImageShape, gridShape);

    expect(offset[0]).toEqual([10, 20]);
    expect(offset[2]).toEqual([205, 5]);
  });

  it('places samples by the provided sampleRowCol (grouped rows)', () => {
    const results = [];
    results[0] = [10, 20]; // sample-0
    results[2] = [5, 5]; // sample-1

    // group layout: sample-0 in row 0, sample-1 in row 1 (one per row)
    const sampleRowCol = [{ row: 0, col: 0 }, { row: 1, col: 0 }];
    const groupedGrid = [2, 1]; // 2 rows, 1 column

    const offset = offsetCentroids(
      results, properties, sampleIds, perImageShape, groupedGrid, sampleRowCol,
    );

    // sample-0: no offset; sample-1: shifted DOWN by one image height (row 1)
    expect(offset[0]).toEqual([10, 20]);
    expect(offset[2]).toEqual([5, 105]);
  });

  it('leaves null/undefined (filtered) cells as holes, producing a sparse array', () => {
    const results = [];
    results[0] = [10, 20];
    results[1] = null; // QC-filtered cell: null in the worker result
    results[2] = [5, 5];
    // index 3 never assigned (sparse hole)

    const offset = offsetCentroids(results, properties, sampleIds, perImageShape, gridShape);

    expect(1 in offset).toBe(false);
    expect(3 in offset).toBe(false);
    expect(offset[0]).toBeDefined();
    expect(offset[2]).toBeDefined();
  });

  it('does not throw on [NaN, NaN] cells (filtered cells serialised as NaN)', () => {
    const results = [];
    results[0] = [10, 20];
    results[3] = [NaN, NaN]; // filtered cell arriving as NaN from R->python

    let offset;
    expect(() => {
      offset = offsetCentroids(results, properties, sampleIds, perImageShape, gridShape);
    }).not.toThrow();

    // the NaN cell is offset but stays non-finite (downstream cellsInAnyCluster skips it)
    expect(offset[3].every((v) => Number.isNaN(v))).toBe(true);
  });

  it('skips cells that do not belong to any sample without throwing', () => {
    const results = [];
    results[0] = [10, 20];
    results[9] = [1, 1]; // cell id not in any sample's cellIds

    let offset;
    expect(() => {
      offset = offsetCentroids(results, properties, sampleIds, perImageShape, gridShape);
    }).not.toThrow();

    expect(9 in offset).toBe(false);
  });
});

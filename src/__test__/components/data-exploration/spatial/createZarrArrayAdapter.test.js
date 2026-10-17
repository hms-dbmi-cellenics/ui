import { createZarrArrayAdapterGrid } from 'components/data-exploration/spatial/createZarrArrayAdapter';

// zarrita's slice/get, reduced to what the grid adapter uses: each sample array
// returns its region filled with the array's own marker value.
jest.mock('zarrita', () => ({
  slice: (start, stop, step = 1) => ({ start, stop, step }),
  get: jest.fn(async (arr, selection) => {
    const [, ySel, xSel] = selection;
    const height = ySel.stop - ySel.start;
    const width = xSel.stop - xSel.start;
    const TypedArray = { uint8: Uint8Array, float32: Float32Array, int32: Int32Array }[arr.dtype];
    return {
      data: new TypedArray(height * width).fill(arr.value),
      shape: [height, width],
      stride: [width, 1],
    };
  }),
}));

const makeArray = (dtype, value) => ({ dtype, value, shape: [1, 4, 4] });
const fullGrid = (numCols) => [0, null, { start: 0, stop: 4 * numCols, step: 1 }];

describe('createZarrArrayAdapterGrid', () => {
  it('composites uint8 images into a Uint8Array matching the reported dtype', async () => {
    const adapter = createZarrArrayAdapterGrid(
      [makeArray('uint8', 10), makeArray('uint8', 20)], [1, 2],
    );

    const tile = await adapter.getRaw(fullGrid(2));

    expect(adapter.dtype).toEqual('|u1');
    expect(tile.data).toBeInstanceOf(Uint8Array);
    expect(tile.shape).toEqual([4, 8]);
    expect(Array.from(tile.data.slice(0, 8))).toEqual([10, 10, 10, 10, 20, 20, 20, 20]);
  });

  it('composites float32 segmentations, including empty filler cells, as Float32Array', async () => {
    // 3 slots, 2 samples: the last cell is an empty filler
    const adapter = createZarrArrayAdapterGrid(
      [makeArray('float32', 1.5), makeArray('float32', 802207)], [1, 3], 0,
    );

    const tile = await adapter.getRaw(fullGrid(3));

    expect(adapter.dtype).toEqual('<f4');
    expect(tile.data).toBeInstanceOf(Float32Array);
    expect(Array.from(tile.data.slice(0, 12))).toEqual([
      1.5, 1.5, 1.5, 1.5, 802207, 802207, 802207, 802207, 0, 0, 0, 0,
    ]);
  });

  it('keeps Int32Array for int32 data (images written before the uint8 fix)', async () => {
    const adapter = createZarrArrayAdapterGrid(
      [makeArray('int32', 7), makeArray('int32', 8)], [1, 2],
    );

    const tile = await adapter.getRaw(fullGrid(2));

    expect(tile.data).toBeInstanceOf(Int32Array);
  });

  it('returns a matching background tile for a request outside the grid', async () => {
    const adapter = createZarrArrayAdapterGrid([makeArray('uint8', 10)], [1, 1]);

    const tile = await adapter.getRaw([
      0, { start: 8, stop: 12, step: 1 }, { start: 0, stop: 4, step: 1 },
    ]);

    expect(tile.data).toBeInstanceOf(Uint8Array);
  });
});

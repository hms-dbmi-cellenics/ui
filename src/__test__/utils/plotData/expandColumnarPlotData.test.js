import expandColumnarPlotData from 'utils/plotData/expandColumnarPlotData';

describe('expandColumnarPlotData', () => {
  it('Expands columns into per-cell records', () => {
    const columnar = {
      columnar: {
        cellId: [0, 1], value: [1.5, null], x: [10.1, 20.2], y: [30.3, 40.4],
      },
    };

    expect(expandColumnarPlotData(columnar)).toEqual([
      {
        cellId: 0, value: 1.5, x: 10.1, y: 30.3,
      },
      {
        cellId: 1, value: null, x: 20.2, y: 40.4,
      },
    ]);
  });

  it('Treats scalar columns as a single cell', () => {
    expect(expandColumnarPlotData({ columnar: { cellId: 7, value: 0 } }))
      .toEqual([{ cellId: 7, value: 0 }]);
  });

  it('Returns empty columns as no records', () => {
    expect(expandColumnarPlotData({ columnar: { cellId: [], value: [] } })).toEqual([]);
  });

  it('Leaves record arrays and other plot data unchanged', () => {
    const records = [{ cellId: 0, value: 1 }];
    const stats = { before: { num_cells: 10 }, after: { num_cells: 8 } };

    expect(expandColumnarPlotData(records)).toBe(records);
    expect(expandColumnarPlotData(stats)).toBe(stats);
    expect(expandColumnarPlotData(null)).toBeNull();
    expect(expandColumnarPlotData(undefined)).toBeUndefined();
  });

  it('Derives value from raw with log1p', () => {
    const expanded = expandColumnarPlotData({
      columnar: { cellId: [0, 1, 2], raw: [0, Math.E - 1, null] },
      valueTransform: 'log1p',
    });

    expect(expanded.map(({ value }) => value)).toEqual([0, 1, null]);
    expect(expanded[1].raw).toEqual(Math.E - 1);
  });

  it('Uses raw as the value when the transform is none', () => {
    expect(expandColumnarPlotData({
      columnar: { cellId: [0], raw: [12.5] },
      valueTransform: 'none',
    })).toEqual([{ cellId: 0, raw: 12.5, value: 12.5 }]);
  });

  it('Keeps a sent value column instead of deriving one', () => {
    expect(expandColumnarPlotData({
      columnar: { cellId: [0], value: [3], controlPercent: [50] },
    })).toEqual([{ cellId: 0, value: 3, controlPercent: 50 }]);
  });
});

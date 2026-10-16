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
});

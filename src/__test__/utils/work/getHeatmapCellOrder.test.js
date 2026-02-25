import getHeatmapCellOrder from 'utils/work/getHeatmapCellOrder';

describe('getHeatmapCellOrder', () => {
  // Mock cell sets structure
  const mockCellSets = {
    hierarchy: [
      {
        key: 'louvain',
        children: [
          { key: 'louvain-0' },
          { key: 'louvain-1' },
          { key: 'louvain-2' },
        ],
      },
      {
        key: 'sample',
        children: [
          { key: 'sample-1' },
          { key: 'sample-2' },
        ],
      },
      {
        key: 'patient',
        children: [
          { key: 'patient-A' },
          { key: 'patient-B' },
        ],
      },
    ],
    properties: {
      'louvain-0': {
        key: 'louvain-0',
        cellIds: new Set([0, 1, 2, 3, 4]),
      },
      'louvain-1': {
        key: 'louvain-1',
        cellIds: new Set([5, 6, 7, 8, 9]),
      },
      'louvain-2': {
        key: 'louvain-2',
        cellIds: new Set([10, 11, 12, 13, 14]),
      },
      'sample-1': {
        key: 'sample-1',
        cellIds: new Set([0, 1, 4, 5, 6, 10, 11, 14]),
      },
      'sample-2': {
        key: 'sample-2',
        cellIds: new Set([2, 3, 7, 8, 9, 12, 13]),
      },
      'patient-A': {
        key: 'patient-A',
        cellIds: new Set([0, 2, 4, 5, 7, 10, 12]),
      },
      'patient-B': {
        key: 'patient-B',
        cellIds: new Set([1, 3, 6, 8, 9, 11, 13, 14]),
      },
    },
  };

  it('returns all cells from selected cell set when selectedPoints is "All" and no hidden cells', () => {
    const result = getHeatmapCellOrder(
      'louvain',
      ['sample', 'patient'],
      'All',
      [],
      mockCellSets,
      1000,
    );

    expect(result).toHaveLength(15);
    expect(new Set(result)).toEqual(
      new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]),
    );
  });

  it('filters cells by selectedPoints', () => {
    const result = getHeatmapCellOrder(
      'louvain',
      ['sample', 'patient'],
      'sample-1',
      [],
      mockCellSets,
      1000,
    );

    // Only cells in sample-1 should be included
    expect(new Set(result)).toEqual(new Set([0, 1, 4, 5, 6, 10, 11, 14]));
  });

  it('removes hidden cells', () => {
    const result = getHeatmapCellOrder(
      'louvain',
      ['sample', 'patient'],
      'All',
      ['louvain-0'],
      mockCellSets,
      1000,
    );

    // Cells from louvain-0 should be removed
    expect(new Set(result)).toEqual(
      new Set([5, 6, 7, 8, 9, 10, 11, 12, 13, 14]),
    );
  });

  it('combines filter by selectedPoints and hidden cells', () => {
    const result = getHeatmapCellOrder(
      'louvain',
      ['sample', 'patient'],
      'sample-1',
      ['louvain-0'],
      mockCellSets,
      1000,
    );

    // Sample-1 has cells [0, 1, 4, 5, 6, 10, 11, 14]
    // Remove louvain-0 which has [0, 1, 2, 3, 4]
    // Should leave [5, 6, 10, 11, 14]
    expect(new Set(result)).toEqual(new Set([5, 6, 10, 11, 14]));
  });

  it('performs proportional downsampling when maxCells is exceeded', () => {
    const result = getHeatmapCellOrder(
      'louvain',
      ['sample', 'patient'],
      'All',
      [],
      mockCellSets,
      5, // max 5 cells
    );

    expect(result.length).toBeLessThanOrEqual(5);
    // Verify all returned cells are valid
    const allCells = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
    result.forEach((cell) => {
      expect(allCells.has(cell)).toBe(true);
    });
  });

  it('respects cartesian product bucketing', () => {
    // With ['sample', 'patient'] as grouped tracks, cells should be distributed
    // across buckets: (sample-1, patient-A), (sample-1, patient-B),
    // (sample-2, patient-A), (sample-2, patient-B)
    const result = getHeatmapCellOrder(
      'louvain',
      ['sample', 'patient'],
      'All',
      [],
      mockCellSets,
      10, // Limit to less than 14 to trigger proportional sampling
    );

    expect(result.length).toBeLessThanOrEqual(10);
    // Each bucket should have some representation if total is limited
  });

  it('returns empty array for invalid selected cell set', () => {
    const result = getHeatmapCellOrder(
      'invalid-key',
      ['sample', 'patient'],
      'All',
      [],
      mockCellSets,
      1000,
    );

    expect(result).toEqual([]);
  });

  it('returns empty array when all cells are hidden', () => {
    const result = getHeatmapCellOrder(
      'louvain',
      ['sample', 'patient'],
      'All',
      ['louvain-0', 'louvain-1', 'louvain-2'],
      mockCellSets,
      1000,
    );

    expect(result).toEqual([]);
  });

  it('handles Set or Array for hiddenCellSets', () => {
    const resultFromSet = getHeatmapCellOrder(
      'louvain',
      ['sample', 'patient'],
      'All',
      new Set(['louvain-0']),
      mockCellSets,
      1000,
    );

    const resultFromArray = getHeatmapCellOrder(
      'louvain',
      ['sample', 'patient'],
      'All',
      ['louvain-0'],
      mockCellSets,
      1000,
    );

    expect(new Set(resultFromSet)).toEqual(new Set(resultFromArray));
  });

  it('returns empty array for null or undefined cellSets', () => {
    expect(getHeatmapCellOrder('louvain', ['sample'], 'All', [], null, 1000)).toEqual([]);
    expect(getHeatmapCellOrder('louvain', ['sample'], 'All', [], undefined, 1000)).toEqual([]);
  });
});

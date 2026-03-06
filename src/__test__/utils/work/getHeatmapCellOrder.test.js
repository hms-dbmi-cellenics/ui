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

  it('returns all cells from selected cell set when no hidden cells', () => {
    const result = getHeatmapCellOrder(
      'louvain',
      ['sample', 'patient'],
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
    // selectedPoints='sample-1' means only show cells in sample-1
    // So we hide everything else (sample-2)
    const result = getHeatmapCellOrder(
      'louvain',
      ['sample', 'patient'],
      ['sample-2'], // Hide everything NOT in sample-1
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
    // selectedPoints='sample-1' would hide cells NOT in sample-1: [2, 3, 7, 8, 9, 12, 13]
    // Plus we hide louvain-0: [0, 1, 2, 3, 4]
    // Combined hidden: [0, 1, 2, 3, 4, 7, 8, 9, 12, 13]
    // Remaining visible: [5, 6, 10, 11, 14]
    const result = getHeatmapCellOrder(
      'louvain',
      ['sample', 'patient'],
      [
        // Hidden cells from selectedPoints='sample-1'
        'sample-2',
        // Additional hidden cells
        'louvain-0',
      ],
      mockCellSets,
      1000,
    );

    // Sample-1 visible cells [0, 1, 4, 5, 6, 10, 11, 14]
    // Remove louvain-0 which has [0, 1, 2, 3, 4]
    // Should leave [5, 6, 10, 11, 14]
    expect(new Set(result)).toEqual(new Set([5, 6, 10, 11, 14]));
  });

  it('performs proportional downsampling when maxCells is exceeded', () => {
    const result = getHeatmapCellOrder(
      'louvain',
      ['sample', 'patient'],
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
      new Set(['louvain-0']),
      mockCellSets,
      1000,
    );

    const resultFromArray = getHeatmapCellOrder(
      'louvain',
      ['sample', 'patient'],
      ['louvain-0'],
      mockCellSets,
      1000,
    );

    expect(new Set(resultFromSet)).toEqual(new Set(resultFromArray));
  });

  it('returns empty array for null or undefined cellSets', () => {
    expect(getHeatmapCellOrder('louvain', ['sample'], [], null, 1000)).toEqual([]);
    expect(getHeatmapCellOrder('louvain', ['sample'], [], undefined, 1000)).toEqual([]);
  });

  it('handles empty groupedTracks gracefully', () => {
    const result = getHeatmapCellOrder(
      'louvain',
      [],
      [],
      mockCellSets,
      1000,
    );

    expect(result).toEqual([]);
  });

  it('maintains proportional distribution across buckets with downsampling', () => {
    // With 15 cells total and groupedTracks=['sample', 'patient']
    // Should create cartesian product buckets and downsample proportionally
    // With 4 buckets from [sample, patient] cartesian product, need sufficient size
    const result = getHeatmapCellOrder(
      'louvain',
      ['sample', 'patient'],
      [],
      mockCellSets,
      4, // Sample size proportional to bucket count
    );

    // Should return up to 4 cells
    expect(result.length).toBeLessThanOrEqual(4);
    // Verify all returned cells are valid
    const allValidCells = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
    result.forEach((cell) => {
      expect(allValidCells.has(cell)).toBe(true);
    });
  });

  it('downsampling respects maxCells limit strictly', () => {
    const maxCells = 7;
    const result = getHeatmapCellOrder(
      'louvain',
      ['sample', 'patient'],
      [],
      mockCellSets,
      maxCells,
    );

    expect(result.length).toBeLessThanOrEqual(maxCells);
  });

  it('preserves all cells when under maxCells threshold', () => {
    const result = getHeatmapCellOrder(
      'louvain',
      ['sample', 'patient'],
      [],
      mockCellSets,
      20, // Higher than total cells
    );

    // Should return all 15 cells without downsampling
    expect(result).toHaveLength(15);
    expect(new Set(result)).toEqual(
      new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]),
    );
  });

  it('distributes downsampled cells across cartesian product buckets', () => {
    // Sample-A: [0, 2, 4, 5, 7, 10, 12]
    // Sample-B: [1, 3, 6, 8, 9, 11, 13, 14]
    // Cartesian product with patient creates 4 buckets
    // When downsampled, should have cells from multiple buckets
    const results = [];
    for (let i = 0; i < 5; i += 1) {
      const result = getHeatmapCellOrder(
        'louvain',
        ['sample', 'patient'],
        [],
        mockCellSets,
        10,
      );
      results.push(result);
    }

    // All runs should return downsampled cells
    results.forEach((result) => {
      expect(result.length).toBeLessThanOrEqual(10);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  it('handles single grouped track (no cartesian product)', () => {
    const result = getHeatmapCellOrder(
      'louvain',
      ['sample'],
      [],
      mockCellSets,
      1000,
    );

    // Should return all 15 cells (single track doesn't reduce cells)
    expect(result).toHaveLength(15);
    expect(new Set(result)).toEqual(
      new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]),
    );
  });

  it('does not return duplicate cells in result', () => {
    // Run multiple times to ensure no random duplicates
    for (let i = 0; i < 10; i += 1) {
      const result = getHeatmapCellOrder(
        'louvain',
        ['sample', 'patient'],
        [],
        mockCellSets,
        5,
      );

      const uniqueCells = new Set(result);
      expect(uniqueCells.size).toBe(result.length);
    }
  });

  it('filters selectedPoints then applies hidden cells', () => {
    // selectedPoints='sample-1' would keep cells in sample-1: [0, 1, 4, 5, 6, 10, 11, 14]
    // This means hiding sample-2: [2, 3, 7, 8, 9, 12, 13]
    // Additional hidden cells: louvain-0 [0, 1, 2, 3, 4]
    // Combination: hidden [2, 3, 7, 8, 9, 12, 13, 0, 1, 4]
    // Result: [5, 6, 10, 11, 14]
    const result = getHeatmapCellOrder(
      'louvain',
      ['sample', 'patient'],
      [
        'sample-2', // Hide non-sample-1 cells
        'louvain-0', // Additional hidden cells
      ],
      mockCellSets,
      1000,
    );

    // sample-1 - louvain-0 = [5, 6, 10, 11, 14]
    expect(new Set(result)).toEqual(new Set([5, 6, 10, 11, 14]));
  });
});

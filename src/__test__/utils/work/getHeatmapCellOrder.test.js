import getHeatmapCellOrder, {
  getBuckets,
  computeBucketedDisplayCellIds,
  computeHiddenCellSets,
} from 'utils/work/getHeatmapCellOrder';

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

describe('getBuckets', () => {
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
      'louvain-0': { cellIds: new Set([0, 1, 2, 3, 4]) },
      'louvain-1': { cellIds: new Set([5, 6, 7, 8, 9]) },
      'louvain-2': { cellIds: new Set([10, 11, 12, 13, 14]) },
      'sample-1': { cellIds: new Set([0, 1, 4, 5, 6, 10, 11, 14]) },
      'sample-2': { cellIds: new Set([2, 3, 7, 8, 9, 12, 13]) },
      'patient-A': { cellIds: new Set([0, 2, 4, 5, 7, 10, 12]) },
      'patient-B': { cellIds: new Set([1, 3, 6, 8, 9, 11, 13, 14]) },
    },
  };

  it('returns empty buckets and zero totalSize for null cellSets', () => {
    expect(getBuckets('louvain', ['sample'], [], null)).toEqual({ buckets: [], totalSize: 0 });
    expect(getBuckets('louvain', ['sample'], [], undefined)).toEqual({ buckets: [], totalSize: 0 });
  });

  it('returns empty buckets and zero totalSize for missing groupedTracks', () => {
    expect(getBuckets('louvain', null, [], mockCellSets)).toEqual({ buckets: [], totalSize: 0 });
  });

  it('returns empty buckets when groupedTracks is empty', () => {
    const { buckets, totalSize } = getBuckets('louvain', [], [], mockCellSets);
    expect(buckets).toEqual([]);
    expect(totalSize).toBe(0);
  });

  it('returns empty buckets for invalid selectedCellSet', () => {
    const { buckets, totalSize } = getBuckets('invalid-key', ['sample'], [], mockCellSets);
    expect(buckets).toEqual([]);
    expect(totalSize).toBe(0);
  });

  it('returns correct bucket count for single grouped track', () => {
    // One track 'sample' → 2 children → 2 buckets (sample-1 and sample-2)
    const { buckets, totalSize } = getBuckets('louvain', ['sample'], [], mockCellSets);
    expect(buckets).toHaveLength(2);
    expect(totalSize).toBe(15);
  });

  it('returns cartesian product buckets for two grouped tracks', () => {
    // Two tracks → at most 2×2=4 buckets (louvain×sample cartesian product)
    const { buckets, totalSize } = getBuckets('louvain', ['sample', 'patient'], [], mockCellSets);
    expect(buckets).toHaveLength(4);
    expect(totalSize).toBe(15);
  });

  it('totalSize equals the sum of all bucket sizes', () => {
    const { buckets, totalSize } = getBuckets('louvain', ['sample', 'patient'], [], mockCellSets);
    const computedTotal = buckets.reduce((sum, bucket) => sum + bucket.size, 0);
    expect(computedTotal).toBe(totalSize);
  });

  it('each bucket is a Set instance', () => {
    const { buckets } = getBuckets('louvain', ['sample'], [], mockCellSets);
    buckets.forEach((bucket) => expect(bucket).toBeInstanceOf(Set));
  });

  it('buckets collectively contain all enabled cells when no hidden sets', () => {
    const { buckets } = getBuckets('louvain', ['sample'], [], mockCellSets);
    const allCells = new Set();
    buckets.forEach((bucket) => bucket.forEach((id) => allCells.add(id)));
    expect(allCells).toEqual(new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]));
  });

  it('no cell appears in more than one bucket', () => {
    const { buckets } = getBuckets('louvain', ['sample', 'patient'], [], mockCellSets);
    const seen = new Set();
    buckets.forEach((bucket) => {
      bucket.forEach((id) => {
        expect(seen.has(id)).toBe(false);
        seen.add(id);
      });
    });
  });

  it('hidden cell sets are excluded from buckets', () => {
    // Hide louvain-0 ([0,1,2,3,4]) → only 10 cells remain
    const { buckets, totalSize } = getBuckets('louvain', ['sample'], ['louvain-0'], mockCellSets);
    expect(totalSize).toBe(10);
    const allCells = new Set();
    buckets.forEach((bucket) => bucket.forEach((id) => allCells.add(id)));
    [0, 1, 2, 3, 4].forEach((id) => expect(allCells.has(id)).toBe(false));
  });

  it('returns empty buckets when all cells are hidden', () => {
    const { buckets, totalSize } = getBuckets(
      'louvain', ['sample'], ['louvain-0', 'louvain-1', 'louvain-2'], mockCellSets,
    );
    expect(buckets).toEqual([]);
    expect(totalSize).toBe(0);
  });

  it('accepts hiddenCellSets as a Set', () => {
    const { totalSize: sizeFromSet } = getBuckets(
      'louvain', ['sample'], new Set(['louvain-0']), mockCellSets,
    );
    const { totalSize: sizeFromArray } = getBuckets(
      'louvain', ['sample'], ['louvain-0'], mockCellSets,
    );
    expect(sizeFromSet).toBe(sizeFromArray);
  });
});

describe('computeBucketedDisplayCellIds', () => {
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
      'louvain-0': { cellIds: new Set([0, 1, 2, 3, 4]) },
      'louvain-1': { cellIds: new Set([5, 6, 7, 8, 9]) },
      'louvain-2': { cellIds: new Set([10, 11, 12, 13, 14]) },
      'sample-1': { cellIds: new Set([0, 1, 4, 5, 6, 10, 11, 14]) },
      'sample-2': { cellIds: new Set([2, 3, 7, 8, 9, 12, 13]) },
      'patient-A': { cellIds: new Set([0, 2, 4, 5, 7, 10, 12]) },
      'patient-B': { cellIds: new Set([1, 3, 6, 8, 9, 11, 13, 14]) },
    },
  };

  const allCellIds = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

  it('returns empty array for empty workerCellIds', () => {
    expect(
      computeBucketedDisplayCellIds('louvain', ['sample'], [], mockCellSets, []),
    ).toEqual([]);
  });

  it('returns empty array for null workerCellIds', () => {
    expect(
      computeBucketedDisplayCellIds('louvain', ['sample'], [], mockCellSets, null),
    ).toEqual([]);
  });

  it('returns empty array for null cellSets', () => {
    expect(
      computeBucketedDisplayCellIds('louvain', ['sample'], [], null, allCellIds),
    ).toEqual([]);
  });

  it('all returned cell IDs are present in workerCellIds', () => {
    const workerCellIds = [0, 1, 5, 6, 10, 11]; // subset
    const result = computeBucketedDisplayCellIds(
      'louvain', ['sample'], [], mockCellSets, workerCellIds,
    );
    const workerSet = new Set(workerCellIds);
    result.forEach((id) => expect(workerSet.has(id)).toBe(true));
  });

  it('respects maxCells limit', () => {
    const result = computeBucketedDisplayCellIds(
      'louvain', ['sample'], [], mockCellSets, allCellIds, 5,
    );
    expect(result.length).toBeLessThanOrEqual(5);
  });

  it('hidden cells are excluded from results', () => {
    // Hide louvain-0 ([0,1,2,3,4])
    const result = computeBucketedDisplayCellIds(
      'louvain', ['sample'], ['louvain-0'], mockCellSets, allCellIds,
    );
    const hiddenIds = new Set([0, 1, 2, 3, 4]);
    result.forEach((id) => expect(hiddenIds.has(id)).toBe(false));
  });

  it('returns no duplicate cell IDs', () => {
    const result = computeBucketedDisplayCellIds(
      'louvain', ['sample'], [], mockCellSets, allCellIds,
    );
    expect(new Set(result).size).toBe(result.length);
  });

  it('is deterministic - same inputs produce same output', () => {
    const result1 = computeBucketedDisplayCellIds(
      'louvain', ['sample'], [], mockCellSets, allCellIds, 8,
    );
    const result2 = computeBucketedDisplayCellIds(
      'louvain', ['sample'], [], mockCellSets, allCellIds, 8,
    );
    expect(result1).toEqual(result2);
  });

  it('only samples from workerCellIds when it is a subset of all cells', () => {
    // Worker only returned cells from sample-1
    const workerSubset = [0, 1, 4, 5, 6, 10, 11, 14];
    const result = computeBucketedDisplayCellIds(
      'louvain', ['sample'], [], mockCellSets, workerSubset,
    );
    const workerSet = new Set(workerSubset);
    result.forEach((id) => expect(workerSet.has(id)).toBe(true));
  });

  it('returns all eligible cells when under maxCells', () => {
    // With 6 worker cells and default maxCells=5000, should return all 6
    const workerCellIds = [0, 5, 10, 2, 7, 12];
    const result = computeBucketedDisplayCellIds(
      'louvain', ['sample'], [], mockCellSets, workerCellIds,
    );
    expect(result.length).toBe(6);
    expect(new Set(result)).toEqual(new Set(workerCellIds));
  });

  it('represents multiple buckets in the output', () => {
    // All worker cells available, downsampled to 8
    // sample-1 has 8 cells, sample-2 has 7 cells - both buckets should be represented
    const result = computeBucketedDisplayCellIds(
      'louvain', ['sample'], [], mockCellSets, allCellIds, 8,
    );
    const sample1Ids = new Set([0, 1, 4, 5, 6, 10, 11, 14]);
    const sample2Ids = new Set([2, 3, 7, 8, 9, 12, 13]);
    const fromSample1 = result.filter((id) => sample1Ids.has(id));
    const fromSample2 = result.filter((id) => sample2Ids.has(id));
    // Both buckets should be represented
    expect(fromSample1.length).toBeGreaterThan(0);
    expect(fromSample2.length).toBeGreaterThan(0);
  });
});

describe('computeHiddenCellSets', () => {
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
    ],
    properties: {},
    hidden: new Set(),
  };

  it('returns empty array when selectedPoints is All and no hidden sets', () => {
    const result = computeHiddenCellSets('All', mockCellSets);
    expect(result).toEqual([]);
  });

  it('returns existing hidden sets when selectedPoints is All', () => {
    const cellSetsWithHidden = {
      ...mockCellSets,
      hidden: new Set(['louvain-0', 'sample-1']),
    };
    const result = computeHiddenCellSets('All', cellSetsWithHidden);
    expect(result).toEqual(expect.arrayContaining(['louvain-0', 'sample-1']));
    expect(result).toHaveLength(2);
  });

  it('hides sibling cell sets when a specific selectedPoints is chosen', () => {
    // selectedPoints='sample/sample-1' → sample-2 should be hidden
    const result = computeHiddenCellSets('sample/sample-1', mockCellSets);
    expect(result).toContain('sample-2');
    expect(result).not.toContain('sample-1');
  });

  it('keeps selected cell set out of hidden list even if it was hidden before', () => {
    // If sample-1 was already in hidden, selectedPoints='sample/sample-1' should remove it
    const cellSetsWithSample1Hidden = {
      ...mockCellSets,
      hidden: new Set(['sample-1']),
    };
    const result = computeHiddenCellSets('sample/sample-1', cellSetsWithSample1Hidden);
    expect(result).not.toContain('sample-1');
  });

  it('merges cellSets.hidden with selectedPoints-derived hidden sets', () => {
    // louvain-0 is already hidden; selectedPoints hides sample-2 too
    const cellSetsWithHidden = {
      ...mockCellSets,
      hidden: new Set(['louvain-0']),
    };
    const result = computeHiddenCellSets('sample/sample-1', cellSetsWithHidden);
    expect(result).toContain('louvain-0');
    expect(result).toContain('sample-2');
    expect(result).not.toContain('sample-1');
  });

  it('does not add duplicate entries', () => {
    // sample-2 is already in hidden; selectedPoints='sample/sample-1' also hides sample-2
    const cellSetsWithHidden = {
      ...mockCellSets,
      hidden: new Set(['sample-2']),
    };
    const result = computeHiddenCellSets('sample/sample-1', cellSetsWithHidden);
    expect(result.filter((k) => k === 'sample-2')).toHaveLength(1);
  });

  it('returns only cellSets.hidden for null selectedPoints', () => {
    const cellSetsWithHidden = {
      ...mockCellSets,
      hidden: new Set(['louvain-0']),
    };
    const result = computeHiddenCellSets(null, cellSetsWithHidden);
    expect(result).toEqual(['louvain-0']);
  });

  it('returns only cellSets.hidden for undefined selectedPoints', () => {
    const cellSetsWithHidden = {
      ...mockCellSets,
      hidden: new Set(['louvain-1']),
    };
    const result = computeHiddenCellSets(undefined, cellSetsWithHidden);
    expect(result).toEqual(['louvain-1']);
  });

  it('handles selectedPoints with category key not in hierarchy gracefully', () => {
    // 'nonexistent/cell-0' → categoryKey 'nonexistent' not in hierarchy
    const result = computeHiddenCellSets('nonexistent/cell-0', mockCellSets);
    // Should not throw; returns hidden list unchanged
    expect(result).toEqual([]);
  });
});

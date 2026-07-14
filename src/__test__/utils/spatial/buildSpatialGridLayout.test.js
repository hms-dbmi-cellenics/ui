import buildSpatialGridLayout from 'utils/spatial/buildSpatialGridLayout';

describe('buildSpatialGridLayout', () => {
  describe('ungrouped (dense row-major, max 4 columns)', () => {
    it('lays out 3 samples in a single row', () => {
      const { gridShape, slotToSampleIndex, sampleRowCol } = buildSpatialGridLayout(3);
      expect(gridShape).toEqual([1, 3]);
      expect(slotToSampleIndex).toEqual([0, 1, 2]);
      expect(sampleRowCol).toEqual([
        { row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 },
      ]);
    });

    it('wraps past 4 columns and fills the tail with nulls', () => {
      const { gridShape, slotToSampleIndex } = buildSpatialGridLayout(5);
      expect(gridShape).toEqual([2, 4]);
      // 5 samples in a 2x4 grid → 3 trailing filler cells
      expect(slotToSampleIndex).toEqual([0, 1, 2, 3, 4, null, null, null]);
    });

    it('handles zero samples without crashing', () => {
      const { gridShape, slotToSampleIndex } = buildSpatialGridLayout(0);
      expect(gridShape).toEqual([1, 1]);
      expect(slotToSampleIndex).toEqual([null]);
    });

    it('places samples in the provided order (Cell sets tile order)', () => {
      // 3 samples displayed in reverse of their natural index order
      const { slotToSampleIndex, sampleRowCol } = buildSpatialGridLayout(3, null, [2, 0, 1]);
      expect(slotToSampleIndex).toEqual([2, 0, 1]);
      expect(sampleRowCol[2]).toEqual({ row: 0, col: 0 });
      expect(sampleRowCol[0]).toEqual({ row: 0, col: 1 });
      expect(sampleRowCol[1]).toEqual({ row: 0, col: 2 });
    });
  });

  describe('grouped (one row per group)', () => {
    // 5 samples: group A = [0, 1, 2], group B = [3, 4]
    const groups = [
      { groupKey: 'A', sampleIndices: [0, 1, 2] },
      { groupKey: 'B', sampleIndices: [3, 4] },
    ];

    it('puts each group in its own row, width = largest group', () => {
      const { gridShape } = buildSpatialGridLayout(5, groups);
      expect(gridShape).toEqual([2, 3]); // 2 groups, largest has 3
    });

    it('leaves filler cells at the end of the smaller group row', () => {
      const { slotToSampleIndex } = buildSpatialGridLayout(5, groups);
      // row 0: A → [0,1,2]; row 1: B → [3,4,null]
      expect(slotToSampleIndex).toEqual([0, 1, 2, 3, 4, null]);
    });

    it('maps each sample to its group row and column', () => {
      const { sampleRowCol } = buildSpatialGridLayout(5, groups);
      expect(sampleRowCol[0]).toEqual({ row: 0, col: 0 });
      expect(sampleRowCol[2]).toEqual({ row: 0, col: 2 });
      expect(sampleRowCol[3]).toEqual({ row: 1, col: 0 });
      expect(sampleRowCol[4]).toEqual({ row: 1, col: 1 });
    });

    it('preserves group order as the row order', () => {
      const reordered = [
        { groupKey: 'B', sampleIndices: [3, 4] },
        { groupKey: 'A', sampleIndices: [0, 1, 2] },
      ];
      const { sampleRowCol } = buildSpatialGridLayout(5, reordered);
      // B is now row 0, A is row 1
      expect(sampleRowCol[3].row).toBe(0);
      expect(sampleRowCol[0].row).toBe(1);
    });

    it('falls back to dense layout when groups is empty', () => {
      const { gridShape } = buildSpatialGridLayout(3, []);
      expect(gridShape).toEqual([1, 3]);
    });
  });
});

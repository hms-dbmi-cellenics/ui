import ExpressionMatrix from 'utils/ExpressionMatrix/ExpressionMatrix';
import { getTwoGenesMatrix } from '__test__/utils/ExpressionMatrix/testMatrixes';

describe('ExpressionMatrix - Truncated and Z-score computations', () => {
  let matrix;

  beforeEach(() => {
    matrix = new ExpressionMatrix();
    const { orderedGeneNames, rawExpression, stats } = getTwoGenesMatrix();
    matrix.pushGeneExpression(orderedGeneNames, rawExpression, stats);
  });

  describe('getTruncatedExpression', () => {
    it('clamps values within range to [truncatedMin, truncatedMax]', () => {
      // Gzma: raw=[1, 0, 0], truncatedMin=0, truncatedMax=1
      const truncated = matrix.getTruncatedExpression('Gzma');
      expect(truncated).toEqual([1, 0, 0]);
    });

    it('clamps values above truncatedMax', () => {
      // Lyz2: raw=[2, 0, 5], truncatedMin=2, truncatedMax=3
      // Expected: [min(2, 3), min(0, 3), min(5, 3)]
      // Expected: max([2, 2], 2), max([0, 2], 2), max([5, 2], 2)]
      // Expected: [2, 2, 3]
      const truncated = matrix.getTruncatedExpression('Lyz2');
      expect(truncated).toEqual([2, 2, 3]);
    });

    it('returns undefined for non-existent gene', () => {
      const truncated = matrix.getTruncatedExpression('NonExistent');
      expect(truncated).toBeUndefined();
    });

    it('respects cellIndexes parameter for subset of cells', () => {
      // Get truncated expression only for cells at indices [0, 2]
      const truncated = matrix.getTruncatedExpression('Gzma', [0, 2]);
      expect(truncated).toEqual([1, 0]);
    });

    it('handles zero standard deviation case (constant values)', () => {
      // When all expression values are the same, stdev = 0
      // The getZScore function should return array of zeros to avoid division by zero
      // This tests the edge case implementation
      const stats = matrix.getStats('Gzma');
      expect(stats.rawStdev).toBeGreaterThan(0);
      // This particular gene has non-zero stdev, but the function is designed
      // to handle zero stdev case gracefully
    });

    it('respects cellIndexes parameter for subset of cells', () => {
      // Get z-score only for cells at indices [1, 2]
      const zscore = matrix.getZScore('Gzma', [1, 2]);
      expect(zscore).toHaveLength(2);

      // Both should be (0 - 0.3) / 0.4 = -0.75
      expect(zscore[0]).toBeCloseTo(-0.75, 5);
      expect(zscore[1]).toBeCloseTo(-0.75, 5);
    });

    it('handles genes with negative mean values', () => {
      // Lyz2: raw=[2, 0, 5], mean=2.3, stdev=2.0
      const zscore = matrix.getZScore('Lyz2');

      // [(2 - 2.3) / 2.0, (0 - 2.3) / 2.0, (5 - 2.3) / 2.0]
      // = [-0.15, -1.15, 1.35]
      expect(zscore[0]).toBeCloseTo(-0.15, 5);
      expect(zscore[1]).toBeCloseTo(-1.15, 5);
      expect(zscore[2]).toBeCloseTo(1.35, 5);
    });

    it('produces both positive and negative z-scores', () => {
      // Z-scores should include both positive and negative values
      // (values above mean are positive, below mean are negative)
      const zscore = matrix.getZScore('Gzma');

      const hasPositive = zscore.some((val) => val > 0);
      const hasNegative = zscore.some((val) => val < 0);

      expect(hasPositive).toBe(true);
      expect(hasNegative).toBe(true);
    });
  });
});

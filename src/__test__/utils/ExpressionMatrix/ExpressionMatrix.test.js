// import { SparseMatrix } from 'mathjs';

import ExpressionMatrix from 'utils/ExpressionMatrix/ExpressionMatrix';
import { getTwoGenesMatrix } from '__test__/utils/ExpressionMatrix/testMatrixes';

describe('ExpressionMatrix', () => {
  let matrix;
  describe('Empty matrix', () => {
    beforeEach(() => {
      matrix = new ExpressionMatrix();
    });

    it('getRawExpression works', () => {
      expect(matrix.getRawExpression('Gzma')).toBeUndefined();
    });

    it('getTruncatedExpression works', () => {
      expect(matrix.getRawExpression('Gzma')).toBeUndefined();
    });

    it('getStats works', () => {
      expect(matrix.getStats('Gzma')).toBeUndefined();
    });

    it('geneIsLoaded works', () => {
      expect(matrix.geneIsLoaded('Gzma')).toEqual(false);
    });

    it('genesAreLoaded works', () => {
      expect(matrix.genesAreLoaded(['Gzma, Lyz2'])).toEqual(false);
    });

    it('getStoredGenes works', () => {
      expect(matrix.getStoredGenes()).toEqual([]);
    });

    it('setGeneExpression works', () => {
      const {
        order, rawExpression, truncatedExpression, stats,
      } = getTwoGenesMatrix();

      matrix.setGeneExpression(order, rawExpression, truncatedExpression, stats);

      expect(matrix).toMatchSnapshot();
    });

    it('pushGeneExpression works', () => {
      const {
        order, rawExpression, truncatedExpression, stats,
      } = getTwoGenesMatrix();

      matrix.pushGeneExpression(order, rawExpression, truncatedExpression, stats);

      expect(matrix).toMatchSnapshot();
    });

    it('generateIndexFor works', () => {
      matrix.generateIndexFor('Gzma');

      expect(matrix).toMatchSnapshot();
    });
  });
});

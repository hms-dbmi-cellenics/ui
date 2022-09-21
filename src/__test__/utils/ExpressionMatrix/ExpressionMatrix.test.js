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

  describe('Filled matrix', () => {
    beforeEach(() => {
      matrix = new ExpressionMatrix();
      const {
        order, rawExpression, truncatedExpression, stats,
      } = getTwoGenesMatrix();

      matrix.setGeneExpression(order, rawExpression, truncatedExpression, stats);
    });

    it('getRawExpression on existing gene works', () => {
      expect(matrix.getRawExpression('Lyz2')).toEqual([2, 0, 5]);
    });

    it('getRawExpression on non existing gene works', () => {
      expect(matrix.getRawExpression('NotExist')).toBeUndefined();
    });

    it('getTruncatedExpression works', () => {
      expect(matrix.getTruncatedExpression('Gzma')).toEqual([1, 0, 0]);
    });

    it('getStats works', () => {
      expect(matrix.getStats('Gzma')).toEqual(getTwoGenesMatrix().stats.Gzma);
    });

    it('geneIsLoaded on existing gene returns true', () => {
      expect(matrix.geneIsLoaded('Lyz2')).toEqual(true);
    });

    it('geneIsLoaded on non existing gene returns false', () => {
      expect(matrix.geneIsLoaded('IdontExist')).toEqual(false);
    });

    it('genesAreLoaded on existing genes returns true', () => {
      expect(matrix.genesAreLoaded(['Lyz2', 'Gzma'])).toEqual(true);
    });

    it('genesAreLoaded on a mix returns false', () => {
      expect(matrix.genesAreLoaded(['Lyz2', 'IdontExist', 'Gzma'])).toEqual(false);
    });

    it('getStoredGenes works', () => { });

    it('setGeneExpression works', () => { });

    it('pushGeneExpression works', () => { });

    it('generateIndexFor works', () => { });
  });
});

import _ from 'lodash';

import ExpressionMatrix from 'utils/ExpressionMatrix/ExpressionMatrix';
import { getOtherFourGenesMatrix, getOtherTwoGenesMatrix, getTwoGenesMatrix } from '__test__/utils/ExpressionMatrix/testMatrixes';

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
      expect(matrix.genesAreLoaded(['Gzma', 'Lyz2'])).toEqual(false);
    });

    it('getStoredGenes works', () => {
      expect(matrix.getStoredGenes()).toEqual([]);
    });

    it('setGeneExpression works', () => {
      const {
        orderedGeneNames, rawExpression, truncatedExpression, zScore, stats,
      } = getTwoGenesMatrix();

      matrix.pushGeneExpression(
        orderedGeneNames, rawExpression, truncatedExpression, zScore, stats,
      );

      expect(matrix).toMatchSnapshot();
    });

    it('pushGeneExpression works', () => {
      const {
        orderedGeneNames, rawExpression, truncatedExpression, zScore, stats,
      } = getTwoGenesMatrix();

      matrix.pushGeneExpression(
        orderedGeneNames, rawExpression, truncatedExpression, zScore, stats,
      );

      expect(matrix).toMatchSnapshot();
    });
  });

  describe('Filled matrix', () => {
    beforeEach(() => {
      matrix = new ExpressionMatrix();
      const {
        orderedGeneNames, rawExpression, truncatedExpression, zScore, stats,
      } = getTwoGenesMatrix();

      matrix.pushGeneExpression(
        orderedGeneNames, rawExpression, truncatedExpression, zScore, stats,
      );
    });

    it('getRawExpression on existing gene works', () => {
      expect(matrix.getRawExpression('Lyz2')).toEqual([2, 0, 5]);
    });

    it('getRawExpression on non existing gene works', () => {
      expect(matrix.getRawExpression('NotExist')).toBeUndefined();
    });

    it('getZScore on non existing gene works', () => {
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

    it('getStoredGenes works', () => {
      expect(matrix.getStoredGenes()).toEqual(['Gzma', 'Lyz2']);
    });

    it('pushGeneExpression adds new data keeping previous', () => {
      const {
        orderedGeneNames, rawExpression, truncatedExpression, zScore, stats,
      } = getOtherTwoGenesMatrix();

      matrix.pushGeneExpression(
        orderedGeneNames, rawExpression, truncatedExpression, zScore, stats,
      );

      expect(matrix).toMatchSnapshot();
    });

    it('pushGeneExpression adds only the data that is new, it skips columns that were already added ', () => {
      const {
        orderedGeneNames, rawExpression, truncatedExpression, zScore, stats,
      } = getOtherFourGenesMatrix();

      matrix.pushGeneExpression(
        orderedGeneNames, rawExpression, truncatedExpression, zScore, stats,
      );

      expect(matrix).toMatchSnapshot();
    });

    it('pushGeneExpression adds nothing is there is nothing new', () => {
      const {
        orderedGeneNames, rawExpression, truncatedExpression, zScore, stats,
      } = getTwoGenesMatrix();

      const previousMatrix = _.cloneDeep(matrix);

      // Add the same data matrix already has
      matrix.pushGeneExpression(
        orderedGeneNames, rawExpression, truncatedExpression, zScore, stats,
      );

      // Nothing changed
      expect(matrix).toEqual(previousMatrix);
    });
  });
});

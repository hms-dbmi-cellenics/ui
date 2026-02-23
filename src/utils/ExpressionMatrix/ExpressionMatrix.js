import _ from 'lodash';
import { SparseMatrix } from 'mathjs';

import { appendColumns, getColumn } from 'utils/ExpressionMatrix/sparseMatrixOperations';

class ExpressionMatrix {
  constructor() {
    this.geneIndexes = {};

    this.rawGeneExpressions = new SparseMatrix();

    this.stats = {
      rawMean: [],
      rawStdev: [],
      truncatedMin: [],
      truncatedMax: [],
    };
  }

  getRawExpression(geneSymbol, cellIndexes = undefined) {
    return this.#getExpression(geneSymbol, cellIndexes, this.rawGeneExpressions);
  }

  /**
   * Computes truncated expression on-the-fly by clamping raw expression
   * values to [truncatedMin, truncatedMax] range for the gene.
   * Truncated expressions are based on a 0.95 quantile threshold.
   * @param {string} geneSymbol
   * @param {undefined|number[]} cellIndexes
   * @returns {number[]|undefined} Truncated expression values
   */
  getTruncatedExpression(geneSymbol, cellIndexes = undefined) {
    const rawExpression = this.getRawExpression(geneSymbol, cellIndexes);
    if (!rawExpression) return undefined;

    const { truncatedMin, truncatedMax } = this.getStats(geneSymbol);
    if (truncatedMin === undefined || truncatedMax === undefined) return undefined;

    return rawExpression.map((value) => Math.max(truncatedMin, Math.min(truncatedMax, value)));
  }

  /**
   * Computes z-score on-the-fly from raw expression using pre-computed
   * mean and standard deviation: (value - mean) / stdev
   * @param {string} geneSymbol
   * @param {undefined|number[]} cellIndexes
   * @returns {number[]|undefined} Z-score values
   */
  getZScore(geneSymbol, cellIndexes = undefined) {
    const rawExpression = this.getRawExpression(geneSymbol, cellIndexes);
    if (!rawExpression) return undefined;

    const { rawMean, rawStdev } = this.getStats(geneSymbol);
    if (rawMean === undefined || rawStdev === undefined) return undefined;

    // Avoid division by zero if stdev is 0
    if (rawStdev === 0) return rawExpression.map(() => 0);

    return rawExpression.map((value) => (value - rawMean) / rawStdev);
  }

  getStats(geneSymbol) {
    const geneIndex = this.geneIndexes[geneSymbol];

    if (_.isNil(geneIndex)) return undefined;

    return {
      rawMean: this.stats.rawMean[geneIndex],
      rawStdev: this.stats.rawStdev[geneIndex],
      truncatedMin: this.stats.truncatedMin[geneIndex],
      truncatedMax: this.stats.truncatedMax[geneIndex],
    };
  }

  geneIsLoaded(geneSymbol) {
    return !_.isNil(this.geneIndexes[geneSymbol]);
  }

  genesAreLoaded(geneSymbols) {
    return geneSymbols.every((geneSymbol) => this.geneIsLoaded(geneSymbol));
  }

  getStoredGenes() {
    return Object.keys(this.geneIndexes);
  }

  /**
   *
   * @param {*} orderedNewGeneSymbols A row with the gene symbols corresponding
   * to each row in the geneExpressions (in the same order)
   * @param {*} newRawGeneExpression A mathjs SparseMatrix with the
   *  raw gene expressions for each of the genes
   * @param {*} newStats An object which with the stats for each gene's expression
   * Each key is a gene symbol,
   * Each value has this shape: {rawMean, rawStdev, truncatedMin, truncatedMax}
   */
  pushGeneExpression(
    orderedNewGeneSymbols,
    newRawGeneExpression,
    newStats,
  ) {
    const [, genesCount] = this.rawGeneExpressions.size();

    // If the matrix was empty previously we can just replace it with the ones that are being pushed
    if (genesCount === 0) {
      this.setGeneExpression(
        orderedNewGeneSymbols,
        newRawGeneExpression,
        newStats,
      );
      return;
    }

    const genesToAddIndexes = [];

    // Store indexes for the new genes
    orderedNewGeneSymbols.forEach((geneSymbol, index) => {
      // Skip if gene is already loaded
      if (this.geneIsLoaded(geneSymbol)) return;

      genesToAddIndexes.push(index);

      this.#generateIndexFor(geneSymbol);
    });

    // Add the expression only for the new genes (genesToAddIndexes)
    appendColumns(this.rawGeneExpressions, newRawGeneExpression, genesToAddIndexes);

    // Add new stats only for the genes that were added
    genesToAddIndexes.forEach((index) => {
      this.stats.rawMean.push(newStats.rawMean[index]);
      this.stats.rawStdev.push(newStats.rawStdev[index]);
      this.stats.truncatedMin.push(newStats.truncatedMin[index]);
      this.stats.truncatedMax.push(newStats.truncatedMax[index]);
    });
  }

  setGeneExpression = (
    orderedNewGeneSymbols,
    newRawGeneExpression,
    newStats,
  ) => {
    this.rawGeneExpressions = newRawGeneExpression;
    this.stats = newStats;

    this.geneIndexes = orderedNewGeneSymbols.reduce((acum, currentSymbol, index) => {
      // eslint-disable-next-line no-param-reassign
      acum[currentSymbol] = index;
      return acum;
    }, {});
  }

  /**
   * Generates a new index for the geneSymbol
   *
   * @param {*} geneSymbol The symbol of the gene
   * @returns The index of the gene inside the matrices
   */
  #generateIndexFor = (geneSymbol) => {
    const lastFreeIndex = Object.keys(this.geneIndexes).length;

    this.geneIndexes[geneSymbol] = lastFreeIndex;

    return lastFreeIndex;
  }

  #getExpression = (geneSymbol, cellIndexes, matrix) => {
    const geneIndex = this.geneIndexes[geneSymbol];

    if (_.isNil(geneIndex)) return undefined;

    if (cellIndexes?.length === 0) return [];

    const result = getColumn(geneIndex, matrix, cellIndexes);

    // If it's a single number wrap in an array
    if (typeof result === 'number') return [result];
    // If its a matrix transform it to an array
    return result.valueOf().flat();
  }
}

export default ExpressionMatrix;

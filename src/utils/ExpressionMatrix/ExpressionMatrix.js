import _ from 'lodash';
import { SparseMatrix } from 'mathjs';

import { appendColumns, getColumn } from 'utils/ExpressionMatrix/sparseMatrixOperations';

class ExpressionMatrix {
  constructor() {
    this.rawGeneExpressions = new SparseMatrix();
    this.truncatedGeneExpressions = new SparseMatrix();
    this.zScore = new SparseMatrix();
    this.stats = {};
    this.geneIndexes = {};
  }

  getRawExpression(geneSymbol, cellIndexes = undefined) {
    return this.#getExpression(geneSymbol, cellIndexes, this.rawGeneExpressions);
  }

  getTruncatedExpression(geneSymbol, cellIndexes = undefined) {
    return this.#getExpression(geneSymbol, cellIndexes, this.truncatedGeneExpressions);
  }

  getZScore(geneSymbol, cellIndexes = undefined) {
    return this.#getExpression(geneSymbol, cellIndexes, this.zScore);
  }

  getStats(geneSymbol) {
    return this.stats[geneSymbol];
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
   * @param {*} newTruncatedGeneExpression A mathjs SparseMatrix with the
   *  raw gene expressions for each of the genes
   * @param {*} newZScore A mathjs SparseMatrix with the
   *  zScore values for each of the genes
   * @param {*} newStats An object which with the stats for each gene's expression
   * Each key is a gene symbol,
   * Each value has this shape: {rawMean, rawStdev, truncatedMin, truncatedMax}
   */
  pushGeneExpression(
    orderedNewGeneSymbols,
    newRawGeneExpression,
    newTruncatedGeneExpression,
    newZScore,
    newStats,
  ) {
    const [, genesCount] = this.rawGeneExpressions.size();

    // If the matrix was empty previously we can just replace it with the ones that are being pushed
    if (genesCount === 0) {
      this.#setGeneExpression(
        orderedNewGeneSymbols,
        newRawGeneExpression,
        newTruncatedGeneExpression,
        newZScore,
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
    appendColumns(this.truncatedGeneExpressions, newTruncatedGeneExpression, genesToAddIndexes);
    appendColumns(this.zScore, newZScore, genesToAddIndexes);

    // Add new gene stats
    _.merge(this.stats, newStats);
  }

  #setGeneExpression = (
    orderedNewGeneSymbols,
    newRawGeneExpression,
    newTruncatedGeneExpression,
    newZScore,
    newStats,
  ) => {
    this.rawGeneExpressions = newRawGeneExpression;
    this.truncatedGeneExpressions = newTruncatedGeneExpression;
    this.zScore = newZScore;
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

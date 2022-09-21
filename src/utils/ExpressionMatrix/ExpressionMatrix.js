import _ from 'lodash';
import { SparseMatrix } from 'mathjs';

import { appendMatrix, getColumn } from 'utils/ExpressionMatrix/sparseMatrixOperations';

// Commented out pending decision on whether to calculate zScore in the UI or not
// const calculateZScore = (expressionsRow, { rawMean: mean, rawStdev: stdev }) => {
//   const [, cellsCount] = expressionsRow.size();

//   const zScoreRow = new SparseMatrix();

//   cellsCount.forEach((cellIndex) => {
//     const index = new Index(0, cellIndex);

//     const expression = expressionsRow.get(index);

//     const zScore = (expression - mean) / stdev;

//     zScoreRow.set(index, zScore);
//   });

//   const expressionsArray = expressionsRow.valueOf()[0];
//   const zScore = expressionsArray.map((expression) => (
//     expression !== null ? (
//       expression - mean) / stdev
//       : null
//   ));
// };

// const calculateZScore = (responseData) => {
//   const dataWithZScore = Object.entries(responseData).reduce((acc, [gene, value]) => {
//     const { mean, stdev, expression } = value.rawExpression;
//     const zScore = expression.map((x) => (x !== null ? ((x - mean) / stdev) : null));

//     acc[gene] = {
//       ...value,
//       zScore,
//     };

//     return acc;
//   }, {});

//   return dataWithZScore;
// };

class ExpressionMatrix {
  constructor() {
    this.rawGeneExpressions = new SparseMatrix();
    this.truncatedGeneExpressions = new SparseMatrix();
    // this.ZScores = new SparseMatrix();
    this.stats = {};

    this.lastFreeIndex = 0;
    this.geneIndexes = {};
  }

  getRawExpression(geneSymbol, cellIndexes = undefined) {
    return this.getExpression(geneSymbol, cellIndexes, this.rawGeneExpressions);
  }

  getTruncatedExpression(geneSymbol, cellIndexes = undefined) {
    return this.getExpression(geneSymbol, cellIndexes, this.truncatedGeneExpressions);
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

  setGeneExpression(newGeneSymbols, newRawGeneExpression, newTruncatedGeneExpression, stats) {
    this.rawGeneExpressions = newRawGeneExpression;
    this.truncatedGeneExpressions = newTruncatedGeneExpression;
    this.stats = stats;

    this.geneIndexes = newGeneSymbols.reduce((acum, currentSymbol, index) => {
      // eslint-disable-next-line no-param-reassign
      acum[currentSymbol] = index;
      return acum;
    }, {});

    this.lastFreeIndex = newGeneSymbols.length;
  }

  /**
   *
   * @param {*} newGeneSymbols A row with the gene symbols corresponding
   * to each row in the geneExpressions (in the same order)
   * @param {*} newRawGeneExpression A mathjs SparseMatrix with the
   *  raw gene expressions for each of the genes
   * @param {*} newTruncatedGeneExpression A mathjs SparseMatrix with the
   *  raw gene expressions for each of the genes
   * @param {*} newStats An object which with the stats for each gene's expression
   * Each key is a gene symbol,
   * Each value has this shape: {rawMean, rawStdev, truncatedMin, truncatedMax}
   */
  pushGeneExpression(newGeneSymbols, newRawGeneExpression, newTruncatedGeneExpression, newStats) {
    const [, genesCount] = this.rawGeneExpressions.size();

    // If the matrix was empty previously we can just replace it with the ones that are being pushed
    if (genesCount === 0) {
      this.setGeneExpression(
        newGeneSymbols,
        newRawGeneExpression,
        newTruncatedGeneExpression,
        newStats,
      );
      return;
    }

    // Append new gene expressions
    appendMatrix(this.rawGeneExpressions, newRawGeneExpression);
    appendMatrix(this.truncatedGeneExpressions, newTruncatedGeneExpression);

    // Add new gene stats
    _.merge(this.stats, newStats);

    // Store indexes for the new genes
    newGeneSymbols.forEach((geneSymbol) => {
      this.generateIndexFor(geneSymbol);
    });
  }

  /**
   * If the gene already has an assigned index, it returns it.
   * If it doesn't, it generates a new one for it
   *
   * @param {*} geneSymbol The symbol of the gene
   * @returns The index of the gene inside the raw and truncated matrixes
   */
  generateIndexFor(geneSymbol) {
    // If not loaded, assign an index to it
    if (_.isNil(this.geneIndexes[geneSymbol])) {
      this.geneIndexes[geneSymbol] = this.lastFreeIndex;

      // This index is now assigned, so move it one step
      this.lastFreeIndex += 1;
    }

    return this.geneIndexes[geneSymbol];
  }

  getExpression(geneSymbol, cellIndexes, matrix) {
    const geneIndex = this.geneIndexes[geneSymbol];

    if (_.isNil(geneIndex)) return undefined;

    const result = getColumn(geneIndex, matrix, cellIndexes);

    // If it's a single number wrap in an array
    if (typeof result === 'number') return [result];
    // If its a matrix transform it to an array
    return result.valueOf().flat();
  }
}

export default ExpressionMatrix;

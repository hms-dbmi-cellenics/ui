import _ from 'lodash';
import { SparseMatrix, Index, Range } from 'mathjs';

import { appendMatrix } from 'utils/ExpressionMatrix/sparseMatrixOperations';

const getColumn = (columnIndex, sparseMatrix) => {
  // const [cellsCount, genesCount] = sparseMatrix.size();
  const cellsCount = sparseMatrix.size()[0];

  return sparseMatrix.subset(new Index(new Range(0, cellsCount), columnIndex));
};

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
    this.lastFreeIndex = 0;

    this.loadedExpressionsIndexes = {};

    this.rawGeneExpressions = new SparseMatrix();
    this.truncatedGeneExpressions = new SparseMatrix();
    // this.ZScores = new SparseMatrix();
  }

  getRawExpression(geneSymbol) {
    const geneIndex = this.getIndexFor(geneSymbol);

    if (_.isNil(geneIndex)) return undefined;

    return getColumn(geneIndex, this.rawGeneExpressions).valueOf();
  }

  getTruncatedExpression(geneSymbol) {
    const geneIndex = this.getIndexFor(geneSymbol);

    if (_.isNil(geneIndex)) return undefined;

    return getColumn(geneIndex, this.truncatedGeneExpressions).valueOf();
  }

  geneIsLoaded(geneSymbol) {
    return !_.isNil(this.loadedExpressionsIndexes[geneSymbol]);
  }

  // setGeneExpression(newGeneSymbols, newRawGeneExpression, newTruncatedGeneExpression, stats) {
  setGeneExpression(newGeneSymbols, newRawGeneExpression, newTruncatedGeneExpression) {
    this.rawGeneExpressions = newRawGeneExpression;
    this.truncatedGeneExpressions = newTruncatedGeneExpression;

    this.loadedExpressionsIndexes = newGeneSymbols.reduce((acum, currentSymbol, index) => {
      // eslint-disable-next-line no-param-reassign
      acum[currentSymbol] = index;
      return acum;
    }, {});

    this.lastFreeIndex = newGeneSymbols.length + 1;
  }

  /**
   *
   * @param {*} newGeneSymbols A row with the gene symbols corresponding
   * to each row in the geneExpressions (in the same order)
   * @param {*} newRawGeneExpression A mathjs SparseMatrix with the
   *  raw gene expressions for each of the genes
   * @param {*} newTruncatedGeneExpression A mathjs SparseMatrix with the
   *  raw gene expressions for each of the genes
   * @param {*} stats An object which with the stats for each gene's expression
   * Each key is a gene symbol,
   * Each value has this shape: {rawMean, rawStdev, truncatedMin, truncatedMax}
   */
  // pushGeneExpression(newGeneSymbols, newRawGeneExpression, newTruncatedGeneExpression, stats) {
  pushGeneExpression(newGeneSymbols, newRawGeneExpression, newTruncatedGeneExpression) {
    const [, genesCount] = this.rawGeneExpressions.size();

    // If the matrix was empty previously we can just replace it with the ones that are being pushed
    if (genesCount === 0) {
      this.setGeneExpression(newGeneSymbols, newRawGeneExpression, newTruncatedGeneExpression);
      return;
    }

    appendMatrix(this.rawGeneExpressions, newRawGeneExpression);
    appendMatrix(this.truncatedGeneExpressions, newTruncatedGeneExpression);

    newGeneSymbols.forEach((geneSymbol) => {
      this.generateIndexFor(geneSymbol);
    });
  }

  getIndexFor(geneSymbol) {
    return this.loadedExpressionsIndexes[geneSymbol];
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
    if (_.isNil(this.loadedExpressionsIndexes[geneSymbol])) {
      this.loadedExpressionsIndexes[geneSymbol] = this.lastFreeIndex;

      // This index is now assigned, so move it one step
      this.lastFreeIndex += 1;
    }

    return this.loadedExpressionsIndexes[geneSymbol];
  }
}

export default ExpressionMatrix;

import _ from 'lodash';
import { SparseMatrix, Index, Range } from 'mathjs';
// import * as math from 'mathjs';

// https://github.com/josdejong/mathjs/issues/1148
// /**
//  * Make a number, array or matrix 2 or more dimensional
//  * If input is already 2 or more dimentional it is returned as is
//  * Arrays are columns by default
//  * @param {number|array|matrix} a - input number, array or matrix
//  * @returns {matrix} - a 2 or more d matrix
//  */
// function Make_Mat(a) {
//   // Get number of dimensions
//   const d = math.matrix(a.size()).size()[0];

//   // Check if already 2D or greater
//   if (d >= 2) {
//     return a;
//   }
//   const n = a.size()[0];

//   // Check if empty matrix
//   if (n === 0) {
//     return a.reshape([0, 0]);
//   }
//   return a.reshape([n, 1]);
// }

// /**
//  * Concatenate any input numbers, arrays or matrices to matrix
//  * @param {number|array|matrix} a - 1st input number array or matrix
//  * @param {number|array|matrix} b - 2nd input number array or matrix
//  * @param {number} dir - direction (0:rows, 1:columns)
//  * @returns {matrix} - concatenated matrix
//  */
// function Concat(a, b, dir) {
//   // Default direction is row
//   if (dir === undefined) {
//     dir = 0;
//   }
//   // Make inputs into 2d matrices
//   a = Make_Mat(a);
//   b = Make_Mat(b);

//   // Check if empty
//   if (Is_Empty(a)) {
//     return b;
//   } if (Is_Empty(b)) {
//     return a;
//   }
//   return Make_Mat(math.concat(a, b, dir));
// }

// const getRow = (rowIndex, sparseMatrix) => {
//   const [, cellsCount] = sparseMatrix.size();
//   return sparseMatrix.subset(new Index(rowIndex, new Range(0, cellsCount)));
// };

const getColumn = (columnIndex, sparseMatrix) => {
  // const [cellsCount, genesCount] = sparseMatrix.size();
  const cellsCount = sparseMatrix.size()[0];

  return sparseMatrix.subset(new Index(new Range(0, cellsCount), columnIndex));
};

// const setRow = (rowIndex, newRow, sparseMatrix) => {
//   const [, cellsCount] = sparseMatrix.size();

//   sparseMatrix.subset(new Index(rowIndex, new Range(0, cellsCount)), newRow);
// };

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

    this.lastFreeIndex = this.loadedExpressionsIndexes + 1;
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
    const [cellsCount, genesCount] = this.rawGeneExpressions.size();

    console.log('cellsCountDebug');
    console.log(cellsCount);

    // If the matrix was empty previously we can just replace it with the new ones
    if (genesCount === 0) {
      // this.setGeneExpression(newGeneSymbols, newRawGeneExpression, newTruncatedGeneExpression);
      // return;

      // const [count1, count2] = newRawGeneExpression.size();

      this.setGeneExpression(newGeneSymbols, newRawGeneExpression, newTruncatedGeneExpression);
      // this.rawGeneExpressions.reshape([count1, count2]);
      // this.truncatedGeneExpressions.resize([count1, count2]);
    }

    console.log('thisrawGeneExpressionsnewRawGeneExpressionDebug');
    console.log(this.rawGeneExpressions, newRawGeneExpression);

    // math.concat(this.truncatedGeneExpressions, newTruncatedGeneExpression, 0);
    // newGeneSymbols.forEach((geneSymbol, index) => {
    //   // Get new gene expression
    //   const newRawGeneExpressionRow = getRow(index, newRawGeneExpression);
    //   const newTruncatedGeneExpressionRow = getRow(index, newTruncatedGeneExpression);
    //   // const newZScoreRow = calculateZScore(newRawGeneExpressionRow, stats[geneSymbol]);

    //   // And store it in the matrix
    //   const geneIndex = this.generateIndexFor(geneSymbol);
    //   setRow(geneIndex, newRawGeneExpressionRow, this.rawGeneExpressions);
    //   setRow(geneIndex, newTruncatedGeneExpressionRow, this.truncatedGeneExpressions);
    //   // setRow(geneIndex, newZScoreRow, this.zScores);
    // });
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

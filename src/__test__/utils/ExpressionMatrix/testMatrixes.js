import _ from 'lodash';
import { SparseMatrix } from 'mathjs';

import ExpressionMatrix from 'utils/ExpressionMatrix/ExpressionMatrix';

const getOneGeneMatrix = (geneSymbol, cellsCount = 10) => ({
  orderedGeneNames: [geneSymbol],
  rawExpression: new SparseMatrix(_.times(cellsCount, 1)),
  truncatedExpression: new SparseMatrix(_.times(cellsCount, 1)),
  zScore: new SparseMatrix(_.times(cellsCount, 1)),
  stats: {
    rawMean: [1],
    rawStdev: [0],
    truncatedMin: [1],
    truncatedMax: [1],
  },
});

const getTwoGenesMatrix = () => ({
  orderedGeneNames: ['Gzma', 'Lyz2'],
  rawExpression: new SparseMatrix([
    [1, 2],
    [0, 0],
    [0, 5],
  ]),
  truncatedExpression: new SparseMatrix([
    [1, 2],
    [0, 0],
    [0, 3],
  ]),
  zScore: new SparseMatrix([
    [1, 1],
    [0, 0],
    [0, 3],
  ]),
  stats: {
    rawMean: [0.3, 2.3],
    rawStdev: [0.4, 2.0],
    truncatedMin: [0, 2],
    truncatedMax: [1, 3],
  },
});

const getOtherTwoGenesMatrix = () => ({
  orderedGeneNames: ['Hba-x', 'Rbp4'],
  rawExpression: new SparseMatrix([
    [5, 2],
    [8, 9],
    [9, 5],
  ]),
  truncatedExpression: new SparseMatrix([
    [1, 2],
    [1, 5],
    [6, 3],
  ]),
  zScore: new SparseMatrix([
    [0, 1],
    [2, 2],
    [4, 3],
  ]),
  stats: {
    rawMean: [5, 10],
    rawStdev: [0.4, 1.9],
    truncatedMin: [10, 0],
    truncatedMax: [15, 6],
  },
});

const getThreeGenesMatrix = () => ({
  orderedGeneNames: ['GeneA', 'GeneB', 'GeneC'],
  rawExpression: new SparseMatrix([
    [1, 2, 1],
    [0, 0, 0],
    [0, 5, 6],
  ]),
  truncatedExpression: new SparseMatrix([
    [1, 2, 0.5],
    [0, 0, 0],
    [0, 3, 1],
  ]),
  zScore: new SparseMatrix([
    [1, 1, 3],
    [0, 0, 0],
    [0, 3, 1],
  ]),
  stats: {
    rawMean: [0.3, 2.3, 1.3],
    rawStdev: [0.4, 2.0, 1.0],
    truncatedMin: [0, 2, 1],
    truncatedMax: [1, 3, 5],
  },
});

const getFourGenesMatrix = () => ({
  orderedGeneNames: ['A', 'B', 'C', 'D'],
  rawExpression: new SparseMatrix([
    [1, 2, 1],
    [0, 0, 0],
    [0, 5, 6],
  ]),
  truncatedExpression: new SparseMatrix([
    [1, 2, 0.5],
    [0, 0, 0],
    [0, 3, 1],
  ]),
  zScore: new SparseMatrix([
    [1, 1, 3],
    [0, 0, 0],
    [0, 3, 1],
  ]),
  stats: {
    rawMean: [0.3, 2.3, 1.3, 14.2],
    rawStdev: [0.4, 2.0, 1.0, 1.2],
    truncatedMin: [0, 2, 1, 0.1],
    truncatedMax: [1, 3, 5, 0.5],
  },
});

const getOtherFourGenesMatrix = () => ({
  orderedGeneNames: ['Gzma', 'Rbp4', 'Lyz2', 'Ms4a4b'],
  rawExpression: new SparseMatrix([
    [1, 9, 1, 1],
    [0, 0, 0, 0],
    [0, 1, 9, 2],
  ]),
  truncatedExpression: new SparseMatrix([
    [0.5, 5, 9, 0.5],
    [0, 0, 0, 0],
    [0, 0.5, 4, 1],
  ]),
  zScore: new SparseMatrix([
    [0, 4, 1, 1],
    [0, 0, 0, 0],
    [0, 1, 0, 3],
  ]),
  stats: {
    rawMean: [0.5, 1.3, 2.3, 0.3],
    rawStdev: [0.9, 1.5, 2.0, 1.2],
    truncatedMin: [0.2, 0, 0.5, 0.4],
    truncatedMax: [2, 5, 3, 0.5],
  },
});

const getTwoGenesExpressionMatrix = () => {
  const matrix = new ExpressionMatrix();

  const {
    orderedGeneNames, rawExpression, truncatedExpression, zScore, stats,
  } = getTwoGenesMatrix();

  matrix.pushGeneExpression(orderedGeneNames, rawExpression, truncatedExpression, zScore, stats);

  return matrix;
};

const getExpressionMatrixFromWorkResult = (workResult) => {
  const matrix = new ExpressionMatrix();

  matrix.pushGeneExpression(
    workResult.orderedGeneNames,
    SparseMatrix.fromJSON(workResult.rawExpression),
    SparseMatrix.fromJSON(workResult.truncatedExpression),
    SparseMatrix.fromJSON(workResult.zScore),
    workResult.stats,
  );

  return matrix;
};

// eslint-disable-next-line import/prefer-default-export
export {
  getOneGeneMatrix, getTwoGenesMatrix, getOtherTwoGenesMatrix,
  getThreeGenesMatrix, getFourGenesMatrix, getOtherFourGenesMatrix,
  getTwoGenesExpressionMatrix, getExpressionMatrixFromWorkResult,
};

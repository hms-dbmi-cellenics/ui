import _ from 'lodash';
import { SparseMatrix } from 'mathjs';

import ExpressionMatrix from 'utils/ExpressionMatrix/ExpressionMatrix';

const getOneGeneMatrix = (geneSymbol, cellsCount = 10) => ({
  order: [geneSymbol],
  rawExpression: new SparseMatrix(_.times(cellsCount, 1)),
  truncatedExpression: new SparseMatrix(_.times(cellsCount, 1)),
  zScore: new SparseMatrix(_.times(cellsCount, 1)),
  stats: {
    a: {
      rawMean: 1, rawStdev: 0, truncatedMin: 1, truncatedMax: 1,
    },
  },
});

const getTwoGenesMatrix = () => ({
  order: ['Gzma', 'Lyz2'],
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
    Gzma: {
      rawMean: 0.3, rawStdev: 0.4, truncatedMin: 0, truncatedMax: 1,
    },
    Lyz2: {
      rawMean: 2.3, rawStdev: 2.0, truncatedMin: 2, truncatedMax: 3,
    },
  },
});

const getOtherTwoGenesMatrix = () => ({
  order: ['Hba-x', 'Rbp4'],
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
    'Hba-x': {
      rawMean: 5, rawStdev: 0.4, truncatedMin: 10, truncatedMax: 15,
    },
    Rbp4: {
      rawMean: 10, rawStdev: 1.9, truncatedMin: 0, truncatedMax: 6,
    },
  },
});

const getThreeGenesMatrix = () => ({
  order: ['GeneA', 'GeneB', 'GeneC'],
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
    GeneA: {
      rawMean: 0.3, rawStdev: 0.4, truncatedMin: 0, truncatedMax: 1,
    },
    GeneB: {
      rawMean: 2.3, rawStdev: 2.0, truncatedMin: 2, truncatedMax: 3,
    },
    GeneC: {
      rawMean: 1.3, rawStdev: 1.0, truncatedMin: 1, truncatedMax: 5,
    },
  },
});

const getFourGenesMatrix = () => ({
  order: ['A', 'B', 'C', 'D'],
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
    A: {
      rawMean: 0.3, rawStdev: 0.4, truncatedMin: 0, truncatedMax: 1,
    },
    B: {
      rawMean: 2.3, rawStdev: 2.0, truncatedMin: 2, truncatedMax: 3,
    },
    GeneC: {
      rawMean: 1.3, rawStdev: 1.0, truncatedMin: 1, truncatedMax: 5,
    },
  },
});

const getTwoGenesExpressionMatrix = () => {
  const matrix = new ExpressionMatrix();

  const {
    order, rawExpression, truncatedExpression, zScore, stats,
  } = getTwoGenesMatrix();

  matrix.setGeneExpression(order, rawExpression, truncatedExpression, zScore, stats);

  return matrix;
};

const getExpressionMatrixFromWorkResult = (workResult) => {
  const matrix = new ExpressionMatrix();

  matrix.pushGeneExpression(
    workResult.order,
    SparseMatrix.fromJSON(workResult.rawExpression),
    SparseMatrix.fromJSON(workResult.truncatedExpression),
    SparseMatrix.fromJSON(workResult.zScore),
    workResult.stats,
  );

  return matrix;
};

// eslint-disable-next-line import/prefer-default-export
export {
  getOneGeneMatrix, getTwoGenesMatrix, getOtherTwoGenesMatrix, getThreeGenesMatrix,
  getFourGenesMatrix, getTwoGenesExpressionMatrix, getExpressionMatrixFromWorkResult,
};

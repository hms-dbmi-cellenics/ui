import _ from 'lodash';
import { SparseMatrix } from 'mathjs';
import * as math from 'mathjs';

import { initialViewState } from './initialState';

const upperCaseArray = (array) => (array?.map((element) => element.toUpperCase()));

const genesExpressionLoaded = (state, action) => {
  const {
    data, componentUuid, genes,
    loadingStatus = _.difference(upperCaseArray(state.expression.loading), upperCaseArray(genes)),
  } = action.payload;

  // If there's any data to load, load it
  if (data && Object.keys(data).length > 0) {
    // All of this code preparing the matrixes is unnecessary
    // once the worker sends us a sparse matrix
    const rawExpressions = [];
    const truncatedExpressions = [];
    const stats = {};

    console.log('internalgenesDebug');
    console.log(genes);

    console.log('internaldataDebug');
    console.log(data);

    Object.keys(data).forEach((geneSymbol) => {
      const dataForGene = data[geneSymbol];

      rawExpressions.push(dataForGene.rawExpression.expression.map((val) => val ?? 0));
      truncatedExpressions.push(
        dataForGene.truncatedExpression.expression.map((val) => val ?? 0),
      );

      stats[geneSymbol] = {
        rawMean: dataForGene.rawExpression.mean,
        rawStdev: dataForGene.rawExpression.stdev,
        truncatedMin: dataForGene.truncatedExpression.min,
        truncatedMax: dataForGene.truncatedExpression.max,
      };
    });

    const rawSparseMatrix = math.transpose(new SparseMatrix(rawExpressions));
    const truncatedSparseMatrix = math.transpose(new SparseMatrix(truncatedExpressions));

    const expressionMatrix = state.expression.matrix;

    expressionMatrix.pushGeneExpression(
      genes,
      rawSparseMatrix,
      truncatedSparseMatrix,
      stats,
    );
  }

  return {
    ...state,
    expression: {
      ...state.expression,
      views: {
        ...state.expression.views,
        [componentUuid]: {
          ...initialViewState,
          ...state.expression.views[componentUuid],
          fetching: false,
          error: false,
          data: genes,
        },
      },
      // data: {
      //   ...state.expression.data,
      //   ...data,
      // },
      loading: loadingStatus,
    },
  };
};

export default genesExpressionLoaded;

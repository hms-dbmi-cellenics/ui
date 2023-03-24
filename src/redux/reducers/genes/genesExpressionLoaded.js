import _ from 'lodash';

import { initialViewState } from './getInitialState';

const upperCaseArray = (array) => (array?.map((element) => element.toUpperCase()));

const genesExpressionLoaded = (state, action) => {
  const {
    componentUuid, genes,
    loadingStatus = _.difference(upperCaseArray(state.expression.loading), upperCaseArray(genes)),
    newGenes = undefined,
  } = action.payload;

  // If there's any data to load, load it
  if (newGenes) {
    const {
      orderedGeneNames,
      rawExpression,
      truncatedExpression,
      zScore,
      stats,
    } = newGenes;

    const expressionMatrix = state.expression.matrix;
    const downsampledExpressionMatrix = state.expression.downsampledMatrix;

    expressionMatrix.pushGeneExpression(
      orderedGeneNames,
      rawExpression,
      truncatedExpression,
      zScore,
      stats,
    );

    downsampledExpressionMatrix.pushGeneExpression(
      orderedGeneNames,
      rawExpression,
      truncatedExpression,
      zScore,
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
      loading: loadingStatus,
    },
  };
};

export default genesExpressionLoaded;

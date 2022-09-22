import _ from 'lodash';

import { initialViewState } from './initialState';

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
      order,
      rawExpression,
      truncatedExpression,
      stats,
    } = newGenes;

    const expressionMatrix = state.expression.matrix;

    expressionMatrix.pushGeneExpression(
      order,
      rawExpression,
      truncatedExpression,
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

import _ from 'lodash';

import upperCaseArray from 'utils/upperCaseArray';
import { initialViewState } from './getInitialState';

const genesExpressionLoaded = (state, action) => {
  const {
    componentUuid, genes,
    loadingStatus = _.difference(
      upperCaseArray(state.expression.full.loading), upperCaseArray(genes),
    ),
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

    state.expression.full.matrix.pushGeneExpression(
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
      full: {
        ...state.expression.full,
        loading: loadingStatus,
      },
    },
  };
};

export default genesExpressionLoaded;

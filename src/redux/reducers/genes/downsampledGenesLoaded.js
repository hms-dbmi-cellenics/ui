import _ from 'lodash';

import { initialViewState } from './getInitialState';

const upperCaseArray = (array) => (array?.map((element) => element.toUpperCase()));

const downsampledGenesLoaded = (state, action) => {
  const {
    componentUuid, genes,
    loadingStatus = _.difference(
      upperCaseArray(state.expression.downsampled.loading), upperCaseArray(genes),
    ),
    newGenes = undefined,
    cellOrder,
  } = action.payload;

  // If there's any data to store, load it
  if (newGenes) {
    const {
      orderedGeneNames,
      rawExpression,
      truncatedExpression,
      zScore,
      stats,
    } = newGenes;

    state.expression.downsampled.matrix.setGeneExpression(
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
      downsampled: {
        ...state.expression.downsampled,
        loading: loadingStatus,
        cellOrder,
      },
    },
  };
};

export default downsampledGenesLoaded;

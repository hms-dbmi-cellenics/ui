import _ from 'lodash';

import { initialViewState } from 'redux/reducers/genes/getInitialState';
import { upperCaseArray } from 'utils/genes';

const downsampledGenesLoaded = (state, action) => {
  const {
    componentUuid,
    genes,
    loadingStatus = _.difference(
      upperCaseArray(state.expression.downsampled.loading), upperCaseArray(genes),
    ),
    newGenes = undefined,
  } = action.payload;

  let cellOrderToStore = state.expression.downsampled.cellOrder;

  // If there's any data to store, load it
  if (newGenes) {
    const {
      orderedGeneNames,
      rawExpression,
      truncatedExpression,
      zScore,
      stats,
      cellOrder,
    } = newGenes;

    state.expression.downsampled.matrix.setGeneExpression(
      orderedGeneNames,
      rawExpression,
      truncatedExpression,
      zScore,
      stats,
    );

    cellOrderToStore = cellOrder;
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
          markers: false,
        },
      },
      downsampled: {
        ...state.expression.downsampled,
        loading: loadingStatus,
        cellOrder: cellOrderToStore,
      },
    },
  };
};

export default downsampledGenesLoaded;

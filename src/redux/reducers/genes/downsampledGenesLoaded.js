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

  console.log('newGenesDebug');
  console.log(newGenes);

  // If there's any data to load, load it
  if (newGenes) {
    const {
      orderedGeneNames,
      rawExpression,
      truncatedExpression,
      zScore,
      stats,
    } = newGenes;

    // if (cellOrder === state.expression.downsampled.cellOrder) {
    // If the cellOrder has changed, then the data we had stored up to now is no longer
    // useful (it's for a cellOrder we no longer use), replace it
    state.expression.downsampled.matrix.setGeneExpression(
      orderedGeneNames,
      rawExpression,
      truncatedExpression,
      zScore,
      stats,
    );
    // } else {
    //   // If the cellOrder matches, add it to what we already have stored
    //   state.expression.full.matrix.pushGeneExpression(
    //     orderedGeneNames,
    //     rawExpression,
    //     truncatedExpression,
    //     zScore,
    //     stats,
    //   );
    // }
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

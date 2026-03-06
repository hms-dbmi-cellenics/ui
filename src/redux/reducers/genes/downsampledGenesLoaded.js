import { initialViewState } from 'redux/reducers/genes/getInitialState';
import _ from 'lodash';

const downsampledGenesLoaded = (state, action) => {
  const {
    componentUuid, genes, ETag, newGenes = undefined,
  } = action.payload;

  // If there's any data to store, load it into the full matrix
  // Use pushGeneExpression to append genes (don't replace), in case there's already data
  if (newGenes) {
    const {
      orderedGeneNames,
      rawExpression,
      stats,
    } = newGenes;

    // Only push to matrix if rawExpression is provided (i.e., new data from worker)
    if (rawExpression) {
      state.expression.full.matrix.pushGeneExpression(
        orderedGeneNames,
        rawExpression,
        stats,
      );
    }
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
        loading: [],
        error: false,
      },
      full: {
        ...state.expression.full,
        loading: _.difference(state.expression.full.loading, genes),
        error: false,
        ETag,
      },
    },
  };
};

export default downsampledGenesLoaded;

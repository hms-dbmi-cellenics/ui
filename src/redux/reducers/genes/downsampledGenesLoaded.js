import { initialViewState } from 'redux/reducers/genes/getInitialState';

const downsampledGenesLoaded = (state, action) => {
  const { componentUuid, genes, ETag, newGenes = undefined } = action.payload;

  let cellOrderToStore = state.expression.downsampled.cellOrder;

  // If there's any data to store, load it into the full matrix
  // Use setGeneExpression to completely replace (not append) since the heatmap
  // needs all genes together in one matrix for proper downsampling
  if (newGenes) {
    const {
      orderedGeneNames,
      rawExpression,
      stats,
      cellOrder,
    } = newGenes;

    state.expression.full.matrix.setGeneExpression(
      orderedGeneNames,
      rawExpression,
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
        loading: [],
        error: false,
        cellOrder: cellOrderToStore,
      },
      full: {
        ...state.expression.full,
        loading: [],
        error: false,
        ETag,
      },
    },
  };
};

export default downsampledGenesLoaded;

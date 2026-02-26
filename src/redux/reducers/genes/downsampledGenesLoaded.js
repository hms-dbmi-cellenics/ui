import { initialViewState } from 'redux/reducers/genes/getInitialState';

const downsampledGenesLoaded = (state, action) => {
  const { componentUuid, genes, ETag, newGenes = undefined } = action.payload;

  let cellOrderToStore = state.expression.downsampled.cellOrder;
  let orderedGeneNamesToStore = state.expression.downsampled.orderedGeneNames;

  // If there's any data to store, load it into the full matrix
  // Use pushGeneExpression to append genes (don't replace), in case there's already data
  if (newGenes) {
    const {
      orderedGeneNames,
      rawExpression,
      stats,
      cellOrder,
    } = newGenes;

    state.expression.full.matrix.pushGeneExpression(
      orderedGeneNames,
      rawExpression,
      stats,
    );

    cellOrderToStore = cellOrder;
    orderedGeneNamesToStore = orderedGeneNames;
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
        orderedGeneNames: orderedGeneNamesToStore,
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

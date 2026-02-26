import _ from 'lodash';
import { SparseMatrix } from 'mathjs';

import {
  DOWNSAMPLED_GENES_EXPRESSION_LOADING,
  DOWNSAMPLED_GENES_EXPRESSION_LOADED,
  DOWNSAMPLED_GENES_EXPRESSION_ERROR,
} from 'redux/actionTypes/genes';

import fetchWork from 'utils/work/fetchWork';
import getTimeoutForWorkerTask from 'utils/getTimeoutForWorkerTask';
import getHeatmapCellOrder from 'utils/work/getHeatmapCellOrder';

// Fetch gene expression for the heatmap using the full cell matrix
// The heatmap will downsample on-the-fly using this full matrix
const loadDownsampledGeneExpression = (
  experimentId,
  genes,
  componentUuid,
  withHiddenCellSets = false,
) => async (dispatch, getState) => {
  if (genes.length === 0) {
    dispatch({
      type: DOWNSAMPLED_GENES_EXPRESSION_LOADED,
      payload: {
        componentUuid,
        genes,
      },
    });

    return;
  }

  const state = getState();

  const {
    groupedTracks,
    selectedCellSet: selectedCellSetKey,
    selectedPoints,
  } = state.componentConfig[componentUuid]?.config;

  const hiddenCellSets = withHiddenCellSets ? Array.from(state.cellSets.hidden) : [];

  // Calculate cell order for downsampling on the client side
  const cellSetData = state.cellSets;
  const cellOrder = getHeatmapCellOrder(
    selectedCellSetKey,
    groupedTracks,
    selectedPoints,
    hiddenCellSets,
    cellSetData,
  );

  // Send request to worker for full expression matrix
  // The heatmap needs a complete set of genes to render correctly,
  // so we request all genes without deduplication
  const body = {
    name: 'GeneExpression',
    genes,
    downsampled: false,
  };

  const timeout = getTimeoutForWorkerTask(getState(), 'GeneExpression');

  try {
    let requestETag = null;

    // Dispatch loading state.
    dispatch({
      type: DOWNSAMPLED_GENES_EXPRESSION_LOADING,
      payload: {
        experimentId,
        componentUuid,
        genes,
        ETag: null,
      },
    });

    const {
      orderedGeneNames,
      rawExpression: rawExpressionJson,
      stats,
    } = await fetchWork(
      experimentId, body, getState, dispatch,
      {
        timeout,
        onETagGenerated: (ETag) => {
          requestETag = ETag;
        },
      },
    );

    // If we had a previous request with a different ETag, that means a newer request
    // was sent while this one was in flight, so skip processing this stale response
    const currentETag = getState().genes.expression.full.ETag;
    if (currentETag !== null && currentETag !== requestETag) {
      return;
    }

    const rawExpression = SparseMatrix.fromJSON(rawExpressionJson);

    dispatch({
      type: DOWNSAMPLED_GENES_EXPRESSION_LOADED,
      payload: {
        componentUuid,
        genes,
        ETag: requestETag,
        newGenes: {
          orderedGeneNames,
          stats,
          rawExpression,
          cellOrder,
        },
      },
    });


  } catch (error) {
    dispatch({
      type: DOWNSAMPLED_GENES_EXPRESSION_ERROR,
      payload: {
        experimentId,
        componentUuid,
        genes,
        error,
      },
    });
  }
};

export default loadDownsampledGeneExpression;

import {
  MARKER_GENES_ERROR, MARKER_GENES_LOADING, MARKER_GENES_LOADED,
} from 'redux/actionTypes/genes';

import fetchWork from 'utils/work/fetchWork';
import getHeatmapCellOrder from 'utils/work/getHeatmapCellOrder';
import getTimeoutForWorkerTask from 'utils/getTimeoutForWorkerTask';
import handleError from 'utils/http/handleError';
import endUserMessages from 'utils/endUserMessages';

const loadMarkerGenes = (
  experimentId, plotUuid, options = {},
) => async (dispatch, getState) => {
  const {
    numGenes = 5,
    groupedTracks = ['sample', 'louvain'],
    selectedCellSetKey = 'louvain',
    selectedPoints = 'All',
    hiddenCellSets = [],
  } = options;

  // Calculate cell order for downsampling on the client side
  const state = getState();
  const cellSetData = state.cellSets;
  const cellOrder = getHeatmapCellOrder(
    selectedCellSetKey,
    groupedTracks,
    selectedPoints,
    hiddenCellSets,
    cellSetData,
  );

  // Send request to worker for marker genes (no downsampling in worker since we moved it to UI)
  // Include dummy downsampleSettings to satisfy API validation
  const body = {
    name: 'MarkerHeatmap',
    nGenes: numGenes,
    downsampleSettings: {
      selectedCellSet: selectedCellSetKey,
      groupedTracks,
      selectedPoints,
      hiddenCellSets: Array.from(hiddenCellSets),
    },
  };

  try {
    const timeout = getTimeoutForWorkerTask(getState(), 'MarkerHeatmap');

    // TODO ask martin if it's fine to use null as default
    let requestETag = null;

    const {
      orderedGeneNames,
      rawExpression: rawExpressionJson,
      stats,
    } = await fetchWork(
      experimentId,
      body,
      getState,
      dispatch,
      {
        timeout,
        onETagGenerated: (ETag) => {
          dispatch({ type: MARKER_GENES_LOADING, payload: { ETag } });
          requestETag = ETag;
        },
      },
    );

    // If we had a previous request with a different ETag, that means a newer request
    // was sent while this one was in flight, so skip processing this stale response
    const currentETag = getState().genes.expression.downsampled.ETag;
    if (currentETag !== null && currentETag !== requestETag) {
      return;
    }

    dispatch({
      type: MARKER_GENES_LOADED,
      payload: {
        plotUuid,
        ETag: requestETag,
        data: {
          orderedGeneNames,
          cellOrder,
        },
      },
    });
  } catch (e) {
    if (e.message.includes('No cells found')) {
      dispatch({
        type: MARKER_GENES_LOADED,
        payload: {
          plotUuid,
          data: {
            orderedGeneNames: [],
            cellOrder: [],
          },
        },
      });

      return;
    }

    const errorMessage = handleError(e, endUserMessages.ERROR_FETCH_MARKER_GENES, undefined, false);

    dispatch({
      type: MARKER_GENES_ERROR,
      payload: {
        error: errorMessage,
      },
    });
  }
};

export default loadMarkerGenes;

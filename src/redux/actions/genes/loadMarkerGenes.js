import {
  MARKER_GENES_ERROR, MARKER_GENES_LOADING, MARKER_GENES_LOADED,
} from 'redux/actionTypes/genes';

import fetchWork from 'utils/work/fetchWork';
import getTimeoutForWorkerTask from 'utils/getTimeoutForWorkerTask';
import handleError from 'utils/http/handleError';
import endUserMessages from 'utils/endUserMessages';
import { updatePlotConfig } from 'redux/actions/componentConfig';

const loadMarkerGenes = (
  experimentId, plotUuid, options = {},
) => async (dispatch, getState) => {
  const {
    numGenes = 5,
    selectedCellSet = 'louvain',
  } = options;

  // Send request to worker for marker genes (no downsampling in worker since we moved it to UI)
  const body = {
    name: 'MarkerHeatmap',
    nGenes: numGenes,
    selectedCellSet,
  };

  try {
    const timeout = getTimeoutForWorkerTask(getState(), 'MarkerHeatmap');

    // TODO ask martin if it's fine to use null as default
    let requestETag = null;

    const {
      orderedGeneNames,
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

    // If the ETag is different, that means that a new request was sent in between
    // So we don't need to handle this outdated result
    if (getState().genes.markerGenes.ETag !== requestETag) {
      return;
    }

    dispatch({
      type: MARKER_GENES_LOADED,
      payload: {
        plotUuid,
        ETag: requestETag,
        data: {
          orderedGeneNames,
        },
      },
    });

    // Sync the ordered marker genes to config as the single source of truth for gene ordering
    dispatch(updatePlotConfig(plotUuid, { selectedGenes: orderedGeneNames }));
  } catch (e) {
    if (e.message.includes('No cells found')) {
      dispatch({
        type: MARKER_GENES_LOADED,
        payload: {
          plotUuid,
          data: {
            orderedGeneNames: [],
          },
        },
      });

      // Empty result still needs to update config
      dispatch(updatePlotConfig(plotUuid, { selectedGenes: [] }));

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

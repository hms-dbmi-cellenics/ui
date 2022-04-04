import {
  MARKER_GENES_ERROR, MARKER_GENES_LOADING, MARKER_GENES_LOADED,
} from 'redux/actionTypes/genes';

import { fetchWork } from 'utils/work/fetchWork';
import getTimeoutForWorkerTask from 'utils/getTimeoutForWorkerTask';
import handleError from 'utils/http/handleError';
import endUserMessages from 'utils/endUserMessages';

const loadMarkerGenes = (
  experimentId, resolution, plotUuid, numGenes = 5, selectedCellSet = 'louvain',
) => async (dispatch, getState) => {
  // Disabled linter because we are using == to check for both null and undefined values
  // eslint-disable-next-line eqeqeq
  if (experimentId == null || resolution == null) throw new Error('Null or undefined parameter/s for loadMarkerGenes');
  const body = {
    name: 'MarkerHeatmap',
    nGenes: numGenes,
    cellSetKey: selectedCellSet,
  };

  dispatch({
    type: MARKER_GENES_LOADING,
  });

  try {
    const timeout = getTimeoutForWorkerTask(getState(), 'MarkerHeatmap');

    console.log('1. lcs load marker genes');
    const data = await fetchWork(experimentId, body, getState, { timeout });
    console.log('marker genes data loaded ', data);
    const { data: markerGeneExpressions, order } = data;
    console.log('marker genes data unst');

    dispatch({
      type: MARKER_GENES_LOADED,
      payload: {
        experimentId,
        genes: order,
        data: markerGeneExpressions,
        plotUuid,
      },
    });
    console.log('marker genes data loaded acked');
  } catch (e) {
    const errorMessage = handleError(e, endUserMessages.ERROR_FETCH_MARKER_GENES, undefined, false);
    console.log('2. lcs marker genes error ', e);
    dispatch({
      type: MARKER_GENES_ERROR,
      payload: {
        experimentId,
        error: errorMessage,
      },
    });
  }
};

export default loadMarkerGenes;

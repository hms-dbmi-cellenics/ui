import {
  MARKER_GENES_ERROR, MARKER_GENES_LOADING,
} from '../../actionTypes/genes';
import sendWork from '../../../utils/sendWork';

const MINUTE = 60;

const REQUEST_TIMEOUT = 5 * MINUTE;

const loadMarkerGenes = (experimentId, resolution) => async (dispatch, getState) => {
  const {
    loading, error,
  } = getState().cellSets;

  const {
    backendStatus,
  } = getState().experimentSettings;

  if (loading || error) {
    return null;
  }

  const body = {
    name: 'MarkerHeatmap',
    nGenes: 3,
    type: 'louvain',
    config: {
      resolution,
    },
  };

  dispatch({
    type: MARKER_GENES_LOADING,
  });

  try {
    await sendWork(experimentId, REQUEST_TIMEOUT, body, backendStatus.status);
  } catch (e) {
    dispatch({
      type: MARKER_GENES_ERROR,
      payload: {
        experimentId,
        error: e,
      },
    });
  }
};

export default loadMarkerGenes;

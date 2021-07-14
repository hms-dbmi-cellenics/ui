import {
  MARKER_GENES_ERROR, MARKER_GENES_LOADING,
} from '../../actionTypes/genes';
import sendWork from '../../../utils/sendWork';

const REQUEST_TIMEOUT = 60;

const loadMarkerGenes = (experimentId, resolution = null) => async (dispatch, getState) => {
  const {
    backendStatus,
    processing,
  } = getState().experimentSettings;

  let resolutionToSend = resolution;

  if (!resolution) {
    resolutionToSend = processing
      .configureEmbedding.clusteringSettings.methodSettings.louvain.resolution;
  }

  const body = {
    name: 'MarkerHeatmap',
    nGenes: 2,
    type: 'louvain',
    config: {
      resolution: resolutionToSend,
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

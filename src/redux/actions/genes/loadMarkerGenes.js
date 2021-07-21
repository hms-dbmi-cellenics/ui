import {
  MARKER_GENES_ERROR, MARKER_GENES_LOADING, MARKER_GENES_LOADED,
} from '../../actionTypes/genes';

import { fetchCachedWork } from '../../../utils/cacheRequest';

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
    const data = await fetchCachedWork(experimentId, REQUEST_TIMEOUT, body, backendStatus.status);

    const { data: markerGeneExpressions, order } = data;

    dispatch({
      type: MARKER_GENES_LOADED,
      payload: {
        experimentId,
        genes: order,
        data: markerGeneExpressions,
      },
    });
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

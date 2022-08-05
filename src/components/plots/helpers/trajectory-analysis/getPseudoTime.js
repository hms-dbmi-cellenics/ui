import getTimeoutForWorkerTask from 'utils/getTimeoutForWorkerTask';
import { PLOT_DATA_LOADED, PLOT_DATA_LOADING, PLOT_DATA_ERROR } from 'redux/actionTypes/componentConfig';

import handleError from 'utils/http/handleError';
import endUserMessages from 'utils/endUserMessages';
import { fetchWork } from 'utils/work/fetchWork';

const getPseudoTime = (
  rootNodes,
  experimentId,
  plotUuid,
) => async (dispatch, getState) => {
  const {
    embeddingSettings,
    clusteringSettings,
  } = getState().experimentSettings.processing?.configureEmbedding || {};

  const {
    ETag,
  } = getState().embeddings[embeddingSettings.method];

  const timeout = getTimeoutForWorkerTask(getState(), 'TrajectoryAnalysis');

  const body = {
    name: 'GetPseudoTime',
    embedding: {
      method: embeddingSettings.method,
      ETag,
    },
    clustering: {
      method: clusteringSettings.method,
      resolution: clusteringSettings.methodSettings[clusteringSettings.method].resolution,
    },
    rootNodes,
  };

  try {
    dispatch({
      type: PLOT_DATA_LOADING,
      payload: { plotUuid },
    });

    const { data } = await fetchWork(
      experimentId, body, getState, { timeout, rerun: true },
    );

    const { plotData } = getState().componentConfig[plotUuid];

    dispatch({
      type: PLOT_DATA_LOADED,
      payload: {
        plotUuid,
        plotData: {
          ...plotData,
          pseudotime: data.pseudotime,
        },
      },
    });
  } catch (e) {
    const errorMessage = handleError(e, endUserMessages.ERROR_FETCHING_PLOT_DATA);

    dispatch({
      type: PLOT_DATA_ERROR,
      payload: {
        plotUuid,
        error: errorMessage,
      },
    });
  }
};

export default getPseudoTime;

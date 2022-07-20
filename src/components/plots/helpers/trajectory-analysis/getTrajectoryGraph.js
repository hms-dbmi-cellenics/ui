import getTimeoutForWorkerTask from 'utils/getTimeoutForWorkerTask';
import { PLOT_DATA_LOADED, PLOT_DATA_LOADING, PLOT_DATA_ERROR } from 'redux/actionTypes/componentConfig';

import handleError from 'utils/http/handleError';
import endUserMessages from 'utils/endUserMessages';
import { fetchWork } from 'utils/work/fetchWork';

const getTrajectoryGraph = (
  experimentId,
  plotUuid,
) => async (dispatch, getState) => {
  const embeddingMethod = getState().experimentSettings.processing
    .configureEmbedding?.embeddingSettings.method;
  const embeddingEtag = getState().embeddings[embeddingMethod].ETag;
  const timeout = getTimeoutForWorkerTask(getState(), 'TrajectoryAnalysis');

  const body = {
    name: 'GetTrajectoryGraph',
    embeddingEtag,
  };

  try {
    dispatch({
      type: PLOT_DATA_LOADING,
      payload: { plotUuid },
    });

    const { data } = await fetchWork(
      experimentId, body, getState, { timeout },
    );

    dispatch({
      type: PLOT_DATA_LOADED,
      payload: {
        plotUuid,
        plotData: data,
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

export default getTrajectoryGraph;

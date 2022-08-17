import getTimeoutForWorkerTask from 'utils/getTimeoutForWorkerTask';
import { PLOT_DATA_LOADED, PLOT_DATA_LOADING, PLOT_DATA_ERROR } from 'redux/actionTypes/componentConfig';

import handleError from 'utils/http/handleError';
import endUserMessages from 'utils/endUserMessages';
import { fetchWork, generateETag } from 'utils/work/fetchWork';
import { getBackendStatus } from 'redux/selectors';
import { getEmbeddingWorkRequestBody } from 'redux/actions/embedding/loadEmbedding';

const getTrajectoryGraph = (
  experimentId,
  plotUuid,
) => async (dispatch, getState) => {
  // Currenty monocle3 only trajectory analysis only supports
  // UMAP embedding. Therefore, this embedding is specifically fetched.
  const embeddingMethod = 'umap';

  const {
    clusteringSettings,
  } = getState().experimentSettings.processing?.configureEmbedding || {};

  const embeddingSettings = getState()
    .experimentSettings
    ?.processing
    ?.configureEmbedding
    ?.embeddingSettings;

  if (!embeddingSettings) return null;

  const { methodSettings } = embeddingSettings;

  const { environment } = getState().networkResources;
  const backendStatus = getBackendStatus(experimentId)(getState()).status;
  const { pipeline: { startDate: qcPipelineStartDate } } = backendStatus;

  const embeddingBody = getEmbeddingWorkRequestBody(methodSettings, embeddingMethod);

  const embeddingETag = generateETag(
    experimentId,
    embeddingBody,
    undefined,
    qcPipelineStartDate,
    environment,
  );

  const timeout = getTimeoutForWorkerTask(getState(), 'TrajectoryAnalysis');

  const body = {
    name: 'GetTrajectoryGraph',
    embedding: {
      method: embeddingMethod,
      methodSettings: methodSettings[embeddingMethod],
      ETag: embeddingETag,
    },
    clustering: {
      method: clusteringSettings.method,
      resolution: clusteringSettings.methodSettings[clusteringSettings.method].resolution,
    },
  };

  try {
    dispatch({
      type: PLOT_DATA_LOADING,
      payload: { plotUuid },
    });

    const data = await fetchWork(
      experimentId, body, getState, { timeout, rerun: true },
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

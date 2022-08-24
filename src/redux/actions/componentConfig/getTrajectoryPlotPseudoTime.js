import getTimeoutForWorkerTask from 'utils/getTimeoutForWorkerTask';
import { PLOT_DATA_LOADED, PLOT_DATA_LOADING, PLOT_DATA_ERROR } from 'redux/actionTypes/componentConfig';

import handleError from 'utils/http/handleError';
import endUserMessages from 'utils/endUserMessages';
import { fetchWork, generateETag } from 'utils/work/fetchWork';
import { getBackendStatus } from 'redux/selectors';

const getPseudoTime = (
  rootNodes,
  experimentId,
  plotUuid,
) => async (dispatch, getState) => {
  const {
    embeddingSettings,
    clusteringSettings,
  } = getState().experimentSettings.processing?.configureEmbedding || {};

  const embeddingState = getState()
    .experimentSettings
    ?.processing
    ?.configureEmbedding
    ?.embeddingSettings;

  const {
    methodSettings,
    method: embeddingMethod,
  } = embeddingState;

  const { environment } = getState().networkResources;
  const backendStatus = getBackendStatus(experimentId)(getState()).status;
  const { pipeline: { startDate: qcPipelineStartDate } } = backendStatus;

  const embeddingBody = {
    name: 'GetEmbedding',
    type: embeddingMethod,
    config: methodSettings[embeddingMethod],
  };

  const timeout = getTimeoutForWorkerTask(getState(), 'TrajectoryAnalysisPseudotime');

  const embeddingETag = generateETag(
    experimentId,
    embeddingBody,
    undefined,
    qcPipelineStartDate,
    environment,
  );

  const body = {
    name: 'GetPseudoTime',
    embedding: {
      method: embeddingSettings.method,
      ETag: embeddingETag,
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

    const data = await fetchWork(
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

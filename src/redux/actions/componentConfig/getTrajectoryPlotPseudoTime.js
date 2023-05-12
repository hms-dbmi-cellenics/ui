import { PLOT_DATA_LOADED, PLOT_DATA_LOADING, PLOT_DATA_ERROR } from 'redux/actionTypes/componentConfig';

import handleError from 'utils/http/handleError';
import endUserMessages from 'utils/endUserMessages';
import fetchWork from 'utils/work/fetchWork';
import getTimeoutForWorkerTask from 'utils/getTimeoutForWorkerTask';
import getEmbeddingETag from 'utils/work/getEmbeddingETag';

const getTrajectoryPlotPseudoTime = (
  rootNodes,
  experimentId,
  plotUuid,
  selectedCellSets,
) => async (dispatch, getState) => {
  // Currenty monocle3 only trajectory analysis only supports
  // UMAP embedding. Therefore, this embedding is specifically fetched.
  const embeddingMethod = 'umap';
  const embeddingETag = await getEmbeddingETag(experimentId, getState, dispatch, embeddingMethod);

  const timeout = getTimeoutForWorkerTask(getState(), 'TrajectoryAnalysisPseudotime');

  const {
    clusteringSettings,
    embeddingSettings,
  } = getState().experimentSettings.processing.configureEmbedding;

  const body = {
    name: 'GetTrajectoryAnalysisPseudoTime',
    embedding: {
      method: embeddingMethod,
      methodSettings: embeddingSettings.methodSettings[embeddingMethod],
      ETag: embeddingETag,
    },
    clustering: {
      method: clusteringSettings.method,
      resolution: clusteringSettings.methodSettings[clusteringSettings.method].resolution,
    },
    cellSets: selectedCellSets,
    rootNodes,
  };

  try {
    dispatch({
      type: PLOT_DATA_LOADING,
      payload: { plotUuid },
    });

    const data = await fetchWork(
      experimentId, body, getState, dispatch, { timeout, rerun: true },
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

    return true;
  } catch (e) {
    const errorMessage = handleError(e, endUserMessages.ERROR_FETCHING_PLOT_DATA);

    dispatch({
      type: PLOT_DATA_ERROR,
      payload: {
        plotUuid,
        error: errorMessage,
      },
    });

    return false;
  }
};

export default getTrajectoryPlotPseudoTime;

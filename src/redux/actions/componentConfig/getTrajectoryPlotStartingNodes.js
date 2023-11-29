import { PLOT_DATA_LOADED, PLOT_DATA_LOADING, PLOT_DATA_ERROR } from 'redux/actionTypes/componentConfig';

import handleError from 'utils/http/handleError';
import endUserMessages from 'utils/endUserMessages';
import fetchWork from 'utils/work/fetchWork';
import getTimeoutForWorkerTask from 'utils/getTimeoutForWorkerTask';

const getTrajectoryPlotStartingNodes = (
  experimentId,
  plotUuid,
  selectedCellSets,
) => async (dispatch, getState) => {
  // Currenty monocle3 only trajectory analysis only supports
  // UMAP embedding. Therefore, this embedding is specifically fetched.
  const embeddingMethod = 'umap';

  const {
    clusteringSettings,
    embeddingSettings: { methodSettings },
  } = getState().experimentSettings.processing.configureEmbedding;

  const timeout = getTimeoutForWorkerTask(getState(), 'TrajectoryAnalysisStartingNodes');

  // the request needs the embeddingETag to merge that data with the rds
  // the embeddingETag is added by the API to this body
  const body = {
    name: 'GetTrajectoryAnalysisStartingNodes',
    embedding: {
      method: embeddingMethod,
      methodSettings: methodSettings[embeddingMethod],
    },
    clustering: {
      method: clusteringSettings.method,
      resolution: clusteringSettings.methodSettings[clusteringSettings.method].resolution,
    },
    cellSets: selectedCellSets,
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
          nodes: data,
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

export default getTrajectoryPlotStartingNodes;

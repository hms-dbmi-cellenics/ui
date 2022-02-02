import {
  CELL_SETS_ERROR, CELL_SETS_CLUSTERING_UPDATING,
} from 'redux/actionTypes/cellSets';

import getTimeoutForWorkerTask from 'utils/getTimeoutForWorkerTask';
import { createObjectHash } from 'utils/work/fetchWork';
import { dispatchWorkRequest } from 'utils/work/seekWorkResponse';
import { getBackendStatus } from 'redux/selectors';

const runCellSetsClustering = (experimentId, resolution) => async (dispatch, getState) => {
  const {
    error, updatingClustering, loading,
  } = getState().cellSets;

  const { experimentSettings: { processing } } = getState();

  const backendStatus = getBackendStatus(experimentId)(getState()).status;
  const { pipeline: { startDate: qcPipelineStartDate } } = backendStatus;

  const { method } = processing.configureEmbedding.clusteringSettings;

  if ((loading && updatingClustering) || error) {
    return null;
  }

  const body = {
    name: 'ClusterCells',
    cellSetName: 'Louvain clusters',
    type: method,
    cellSetKey: 'louvain',
    config: {
      resolution,
    },
  };

  dispatch({
    type: CELL_SETS_CLUSTERING_UPDATING,
  });

  const ETag = createObjectHash({
    experimentId, body, qcPipelineStartDate,
  });

  const timeout = getTimeoutForWorkerTask(getState(), 'ClusterCells');

  try {
    await dispatchWorkRequest(
      experimentId,
      body,
      timeout,
      ETag,
      {
        broadcast: true,
      },
    );
  } catch (e) {
    dispatch({
      type: CELL_SETS_ERROR,
      payload: {
        experimentId,
        error: e,
      },
    });
  }
};

export default runCellSetsClustering;

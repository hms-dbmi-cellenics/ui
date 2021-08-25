import {
  CELL_SETS_ERROR, CELL_SETS_CLUSTERING_UPDATING,
} from '../../actionTypes/cellSets';
import sendWork from '../../../utils/sendWork';
import getTimeoutForWorkerTask from '../../../utils/getTimeoutForWorkerTask';

const runCellSetsClustering = (experimentId, resolution) => async (dispatch, getState) => {
  const {
    loading, error,
  } = getState().cellSets;

  const { backendStatus, experimentSettings } = getState();

  const { processing } = experimentSettings;
  const { status } = backendStatus[experimentId];

  const { method } = processing.configureEmbedding.clusteringSettings;

  if (loading || error) {
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

  const timeout = getTimeoutForWorkerTask(getState(), 'ClusterCells');

  try {
    await sendWork(experimentId, timeout, body, status);
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

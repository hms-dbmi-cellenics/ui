import { fetchWork } from '../../../utils/work/fetchWork';
import {
  CELL_SETS_ERROR, CELL_SETS_CLUSTERING_UPDATING,
} from '../../actionTypes/cellSets';
import updateCellSetsClustering from './updateCellSetsClustering';
import getTimeoutForWorkerTask from '../../../utils/getTimeoutForWorkerTask';

const runCellSetsClustering = (experimentId, resolution) => async (dispatch, getState) => {
  const {
    error, updatingClustering, loading,
  } = getState().cellSets;

  const { experimentSettings } = getState();

  const { status } = getState().backendStatus[experimentId];

  const { processing } = experimentSettings;
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

  const timeout = getTimeoutForWorkerTask(getState(), 'ClusterCells');

  try {
    await fetchWork(experimentId, body, status, {
      timeout,
      eventCallback: (err) => {
        if (err) {
          throw err;
        }

        dispatch(updateCellSetsClustering(experimentId));
      },
    });
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

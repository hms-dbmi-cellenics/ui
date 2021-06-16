import {
  CELL_SETS_ERROR, CELL_SETS_CLUSTERING_UPDATING,
} from '../../actionTypes/cellSets';
import sendWork from '../../../utils/sendWork';

const REQUEST_TIMEOUT = 30;

const runCellSetsClustering = (experimentId, resolution) => async (dispatch, getState) => {
  const {
    loading, error,
  } = getState().cellSets;

  const {
    backendStatus,
  } = getState().experimentSettings;

  if (loading || error) {
    return null;
  }

  const body = {
    name: 'ClusterCells',
    cellSetName: 'Louvain clusters',
    type: 'louvain',
    cellSetKey: 'louvain',
    config: {
      resolution,
    },
  };

  dispatch({
    type: CELL_SETS_CLUSTERING_UPDATING,
  });

  try {
    await sendWork(experimentId, REQUEST_TIMEOUT, body, backendStatus.status);
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

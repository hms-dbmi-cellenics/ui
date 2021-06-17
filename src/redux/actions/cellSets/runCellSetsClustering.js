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

  console.log('Running stuff3');

  if (loading || error) {
    return null;
  }

  console.log('Running stuff2');

  const body = {
    name: 'ClusterCells',
    cellSetName: 'Louvain clusters',
    type: 'louvain',
    cellSetKey: 'louvain',
    config: {
      resolution,
    },
  };

  console.log('Running stuff1');

  dispatch({
    type: CELL_SETS_CLUSTERING_UPDATING,
  });

  try {
    console.log('Running stuff');
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

import {
  CELL_SETS_ERROR, CELL_SETS_CLUSTERING_UPDATING, CELL_SETS_CLUSTERING_UPDATED,
} from '../../actionTypes/cellSets';
import { fetchCachedWork } from '../../../utils/cacheRequest';
import saveCellSets from './saveCellSets';

const REQUEST_TIMEOUT = 30;

const updateCellSetsClustering = (experimentId, resolution) => async (dispatch, getState) => {
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
    const louvainSets = await fetchCachedWork(
      experimentId, REQUEST_TIMEOUT, body, backendStatus.status,
    );
    console.log('louvain sets');
    console.log({ louvainSets });

    const newCellSets = [
      louvainSets,
    ];

    await dispatch({
      type: CELL_SETS_CLUSTERING_UPDATED,
      payload: {
        experimentId,
        data: newCellSets,
      },
    });
    dispatch(saveCellSets(experimentId));
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

export default updateCellSetsClustering;

import {
  CELL_SETS_ERROR, CELL_SETS_CLUSTERING_UPDATED,
} from 'redux/actionTypes/cellSets';

import loadCellSets from './loadCellSets';

const updateCellSetsClustering = (experimentId) => async (dispatch) => {
  try {
    dispatch({ type: CELL_SETS_CLUSTERING_UPDATED });

    dispatch(loadCellSets(experimentId, true));
  } catch (e) {
    dispatch({
      type: CELL_SETS_ERROR,
      payload: { error: e },
    });
  }
};

export default updateCellSetsClustering;

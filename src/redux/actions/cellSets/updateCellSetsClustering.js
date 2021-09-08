import {
  CELL_SETS_ERROR, CELL_SETS_CLUSTERING_UPDATED,
} from '../../actionTypes/cellSets';

import loadCellSets from './loadCellSets';

const updateCellSetsClustering = (experimentId) => async (dispatch) => {
  try {
    dispatch({
      type: CELL_SETS_CLUSTERING_UPDATED,
      payload: {
        experimentId,
      },
    });

    dispatch(loadCellSets(experimentId));
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

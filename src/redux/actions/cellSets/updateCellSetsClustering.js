import {
  CELL_SETS_ERROR, CELL_SETS_CLUSTERING_UPDATED,
} from '../../actionTypes/cellSets';

const updateCellSetsClustering = (experimentId, newCellSets) => async (dispatch) => {
  try {
    dispatch({
      type: CELL_SETS_CLUSTERING_UPDATED,
      payload: {
        experimentId,
        data: newCellSets,
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

export default updateCellSetsClustering;

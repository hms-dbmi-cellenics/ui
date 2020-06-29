import { CELL_SETS_UPDATE_HIERARCHY } from '../../actionTypes/cellSets';
import saveCellSets from './saveCellSets';

const updateCellSetHierarchy = (experimentId, hierarchy) => async (dispatch, getState) => {
  const {
    loading, error,
  } = getState().cellSets;

  if (loading || error) {
    return null;
  }

  await dispatch({
    type: CELL_SETS_UPDATE_HIERARCHY,
    payload: {
      experimentId,
      hierarchy,
    },
  });

  await dispatch(saveCellSets(experimentId));
};

export default updateCellSetHierarchy;

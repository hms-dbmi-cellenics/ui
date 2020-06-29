import { CELL_SETS_UPDATE_PROPERTY } from '../../actionTypes/cellSets';
import saveCellSets from './saveCellSets';

const updateCellSetProperty = (experimentId, key, dataUpdated) => async (dispatch, getState) => {
  const {
    loading, error,
  } = getState().cellSets;

  if (loading || error) {
    return null;
  }

  await dispatch({
    type: CELL_SETS_UPDATE_PROPERTY,
    payload: {
      experimentId,
      key,
      dataUpdated,
    },
  });

  await dispatch(saveCellSets(experimentId));
};

export default updateCellSetProperty;

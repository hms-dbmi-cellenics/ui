import { CELL_SETS_DELETE } from '../../actionTypes/cellSets';
import saveCellSets from './saveCellSets';

const deleteCellSet = (experimentId, key) => async (dispatch, getState) => {
  const {
    loading, error,
  } = getState().cellSets;

  if (loading || error) {
    return null;
  }

  await dispatch({
    type: CELL_SETS_DELETE,
    payload: {
      experimentId,
      key,
    },
  });

  await dispatch(saveCellSets(experimentId));
};

export default deleteCellSet;

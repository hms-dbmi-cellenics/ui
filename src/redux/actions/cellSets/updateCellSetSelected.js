import { CELL_SETS_SET_SELECTED } from '../../actionTypes/cellSets';

const updateCellSetSelected = (keys, tab) => async (dispatch, getState) => {
  const {
    loading, error,
  } = getState().cellSets;

  if (loading || error) {
    return null;
  }

  await dispatch({
    type: CELL_SETS_SET_SELECTED,
    payload: {
      keys,
      tab,
    },
  });
};

export default updateCellSetSelected;

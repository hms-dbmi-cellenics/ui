import { CELL_SETS_SET_SELECTED } from '../../actionTypes/cellSets';

const updateCellSetSelected = (experimentId, keys) => async (dispatch, getState) => {
  const {
    loading, error,
  } = getState().cellSets;

  if (loading || error) {
    return null;
  }

  await dispatch({
    type: CELL_SETS_SET_SELECTED,
    payload: { loadingColors: true },
  });

  setTimeout(() => {
    // Running this action with a delay to allow recoloring of embedding
    dispatch({
      type: CELL_SETS_SET_SELECTED,
      payload: {
        experimentId,
        keys,
        loadingColors: false,
      },
    });
  }, 50);
};

export default updateCellSetSelected;

import {
  CELL_SETS_HIDE, CELL_SETS_UNHIDE,
} from '../../actionTypes/cellSets';

const setCellSetHiddenStatus = (key) => (dispatch, getState) => {
  if (getState().cellSets.hidden.has(key)) {
    dispatch({
      type: CELL_SETS_UNHIDE,
      payload: { key },
    });
  } else {
    dispatch({
      type: CELL_SETS_HIDE,
      payload: { key },
    });
  }
};

export default setCellSetHiddenStatus;

import {
  CELL_INFO_FOCUS, CELL_INFO_UNFOCUS,
} from '../../actionTypes/cellInfo';

const setCellInfoFocus = (
  experimentId, store, key,
) => (dispatch, getState) => {
  if (getState().cellInfo.focus.store === store && getState().cellInfo.focus.key === key) {
    dispatch({
      type: CELL_INFO_UNFOCUS,
      payload: {
        experimentId,
      },
    });
  } else {
    dispatch({
      type: CELL_INFO_FOCUS,
      payload: {
        experimentId,
        store,
        key,
      },
    });
  }
};

export default setCellInfoFocus;

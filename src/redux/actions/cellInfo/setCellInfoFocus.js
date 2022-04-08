import {
  CELL_INFO_FOCUS, CELL_INFO_UNFOCUS,
} from 'redux/actionTypes/cellInfo';

const setCellInfoFocus = (
  experimentId, store, key,
) => (dispatch, getState) => {
  const { store: currentStore, key: currentKey } = getState().cellInfo.focus;

  if (store === currentStore && key === currentKey) {
    dispatch({
      type: CELL_INFO_UNFOCUS,
      payload: {
        experimentId,
      },
    });
    return;
  }

  dispatch({
    type: CELL_INFO_FOCUS,
    payload: {
      experimentId,
      store,
      key,
    },
  });
};

export default setCellInfoFocus;

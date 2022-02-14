import { UPDATE_LAYOUT } from 'redux/actionTypes/layout';

const updateLayout = (windows, panel) => (dispatch) => dispatch({
  type: UPDATE_LAYOUT,
  payload: {
    windows,
    panel,
  },
});

export default updateLayout;

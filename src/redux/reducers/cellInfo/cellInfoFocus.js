import produce from 'immer';
import initialState from 'redux/reducers/cellInfo/initialState';
/* eslint-disable no-param-reassign */

const cellInfoFocus = produce((draft, action) => {
  const { store, key } = action.payload;
  draft.focus.store = store;
  draft.focus.key = key;
}, initialState);

export default cellInfoFocus;

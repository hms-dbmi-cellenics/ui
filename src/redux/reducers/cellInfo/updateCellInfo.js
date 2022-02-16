/* eslint-disable no-param-reassign */
import produce from 'immer';

import initialState from './initialState';

const updateCellInfo = produce((draft, action) => {
  const { cellId } = action.payload;
  draft.cellId = cellId;
}, initialState);

export default updateCellInfo;

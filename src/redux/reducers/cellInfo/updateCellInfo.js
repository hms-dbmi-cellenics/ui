/* eslint-disable no-param-reassign */
import produce from 'immer';

import initialState from './initialState';

const updateCellInfo = produce((draft, action) => {
  const { cellId, hoverSource } = action.payload;
  draft.cellId = cellId;
  // which plot the hover came from, so only that plot shows the tooltip
  draft.hoverSource = hoverSource;
}, initialState);

export default updateCellInfo;

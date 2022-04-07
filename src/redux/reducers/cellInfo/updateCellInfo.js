/* eslint-disable no-param-reassign */
import produce from 'immer';

import initialState from './initialState';

const updateCellInfo = produce((draft, action) => {
  const { cellId, geneName, trackCluster } = action.payload;
  draft.cellId = cellId;
  draft.geneName = geneName;
  draft.trackCluster = trackCluster;
}, initialState);

export default updateCellInfo;

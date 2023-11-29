/* eslint-disable no-param-reassign */
import produce from 'immer';

import initialState from 'redux/reducers/backendStatus/initialState';

import { mergeObjectReplacingArrays } from 'utils/arrayUtils';

const backendStatusUpdated = produce((draft, action) => {
  const { experimentId, status } = action.payload;

  mergeObjectReplacingArrays(draft[experimentId]?.status, status);
}, initialState);

export default backendStatusUpdated;

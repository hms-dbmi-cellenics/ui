/* eslint-disable no-param-reassign */
import produce from 'immer';

import initialState from 'redux/reducers/backendStatus/initialState';

import mergeObjectWithArrays from 'utils/mergeObjectWithArrays';

const backendStatusUpdated = produce((draft, action) => {
  const { experimentId, status } = action.payload;

  mergeObjectWithArrays(draft[experimentId]?.status, status);
}, initialState);

export default backendStatusUpdated;

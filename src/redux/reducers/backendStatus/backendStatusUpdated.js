/* eslint-disable no-param-reassign */
import _ from 'lodash';
import produce from 'immer';

import initialState from './initialState';

const backendStatusUpdated = produce((draft, action) => {
  const { experimentId, status } = action.payload;

  _.merge(draft[experimentId]?.status, status);
}, initialState);

export default backendStatusUpdated;

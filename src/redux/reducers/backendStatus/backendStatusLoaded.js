/* eslint-disable no-param-reassign */
import produce from 'immer';

import initialState from './initialState';

const backendStatusLoaded = produce((draft, action) => {
  const { experimentId, status } = action.payload;

  draft[experimentId] = {
    status,
    loading: false,
    error: false,
  };
}, initialState);

export default backendStatusLoaded;

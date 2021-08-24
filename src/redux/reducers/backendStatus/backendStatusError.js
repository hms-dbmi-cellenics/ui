/* eslint-disable no-param-reassign */
import produce from 'immer';

import initialState from './initialState';

const backendStatusError = produce((draft, action) => {
  const { experimentId, error } = action.payload;

  draft[experimentId] = {
    status: {},
    loading: false,
    error,
  };
}, initialState);

export default backendStatusError;

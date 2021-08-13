/* eslint-disable no-param-reassign */
import produce from 'immer';

import initialState from './initialState';

const backendStatusLoading = produce((draft, action) => {
  const { experimentId } = action.payload;

  draft[experimentId] = {
    loading: true,
    error: false,
    status: {},
  };
}, initialState);

export default backendStatusLoading;

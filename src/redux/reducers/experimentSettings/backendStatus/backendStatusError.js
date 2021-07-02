/* eslint-disable no-param-reassign */
import produce from 'immer';

import initialState from '../initialState';

const backendStatusError = produce((draft, action) => {
  const { error } = action.payload;

  draft.backendStatus = {
    status: {},
    loading: false,
    error,
  };
}, initialState);

export default backendStatusError;

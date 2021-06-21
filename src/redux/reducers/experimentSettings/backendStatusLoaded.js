/* eslint-disable no-param-reassign */
import produce, { original } from 'immer';

import initialState from './initialState';

const backendStatusLoaded = produce((draft, action) => {
  const { status } = action.payload;

  const previousStatus = original(draft.backendStatus?.status);

  const newStatus = {
    pipeline: status.pipeline ?? previousStatus?.pipeline,
    gem2s: status.gem2s ?? previousStatus?.gem2s,
    worker: status.worker ?? previousStatus?.worker,
  };

  draft.backendStatus = {
    status: newStatus,
    loading: false,
    error: false,
  };
}, initialState);

export default backendStatusLoaded;

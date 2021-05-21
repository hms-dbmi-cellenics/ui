import initialState from './initialState';

const backendStatusLoaded = (state, action) => {
  const { status } = action.payload;

  const previousStatus = state.backendStatus?.status;

  const newStatus = {
    pipeline: status.pipeline ?? previousStatus?.pipeline,
    gem2s: status.gem2s ?? previousStatus?.gem2s,
    worker: status.worker ?? previousStatus?.worker,
  };

  return {
    ...initialState,
    ...state,
    backendStatus: {
      status: newStatus,
      loading: false,
      error: false,
    },
  };
};

export default backendStatusLoaded;

import initialState from './initialState';

const backendStatusLoading = (state) => ({
  ...initialState,
  ...state,
  pipelineStatus: {
    ...initialState.pipelineStatus,
    ...state.pipelineStatus,
    loading: true,
    error: false,
  },
});

export default backendStatusLoading;

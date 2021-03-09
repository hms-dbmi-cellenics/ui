import initialState from './initialState';

const pipelineStatusLoading = (state) => ({
  ...initialState,
  ...state,
  pipelineStatus: {
    ...initialState.pipelineStatus,
    ...state.pipelineStatus,
    loading: true,
    error: false,
  },
});

export default pipelineStatusLoading;

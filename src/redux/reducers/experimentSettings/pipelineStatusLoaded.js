import initialState from './initialState';

const pipelineStatusLoading = (state, action) => {
  const { status } = action.payload;

  return {
    ...initialState,
    ...state,
    pipelineStatus: {
      status,
      loading: false,
      error: false,
    },
  };
};

export default pipelineStatusLoading;

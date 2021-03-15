import initialState from './initialState';

const pipelineStatusLoaded = (state, action) => {
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

export default pipelineStatusLoaded;

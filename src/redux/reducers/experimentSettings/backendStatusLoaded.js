import initialState from './initialState';

const backendStatusLoaded = (state, action) => {
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

export default backendStatusLoaded;

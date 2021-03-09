import initialState from './initialState';

const pipelineStatusError = (state, action) => {
  const { error } = action.payload;

  return {
    ...initialState,
    ...state,
    pipelineStatus: {
      status: {},
      loading: false,
      error,
    },
  };
};

export default pipelineStatusError;

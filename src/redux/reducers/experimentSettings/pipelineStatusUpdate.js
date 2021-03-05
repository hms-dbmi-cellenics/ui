import initialState from './initialState';

const updatePipelineStatus = (state, action) => {
  const { status } = action.payload;

  return {
    ...initialState,
    ...state,
    processing: {
      ...initialState.processing,
      ...state.processing,
      pipelineStatus: {
        status,
        error: false,
      },
    },
  };
};

export default updatePipelineStatus;

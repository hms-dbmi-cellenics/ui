import initialState from './initialState';

const backendStatusError = (state, action) => {
  const { error } = action.payload;

  return {
    ...initialState,
    ...state,
    backendStatus: {
      status: {},
      loading: false,
      error,
    },
  };
};

export default backendStatusError;

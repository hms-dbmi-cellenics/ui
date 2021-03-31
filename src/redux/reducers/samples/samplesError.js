const samplesError = (state, action) => {
  const { error } = action.payload;
  return {
    ...state,
    meta: {
      ...state.meta,
      loading: false,
      error,
    },
  };
};

export default samplesError;

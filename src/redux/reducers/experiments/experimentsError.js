const experimentError = (state, action) => {
  const { error } = action.payload;

  return {
    ...state,
    meta: {
      ...state.meta,
      error,
    },
  };
};

export default experimentError;

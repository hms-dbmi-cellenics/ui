const experimentError = (state, action) => {
  const { error } = action.payload;

  return {
    ...state,
    meta: {
      ...state.meta,
      saving: false,
      error,
    },
  };
};

export default experimentError;

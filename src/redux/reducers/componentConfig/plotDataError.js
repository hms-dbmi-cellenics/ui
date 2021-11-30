const plotDataError = (state, action) => {
  const { plotUuid, error } = action.payload;
  return {
    ...state,
    [plotUuid]: {
      ...state[plotUuid],
      loading: false,
      error,
    },
  };
};

export default plotDataError;

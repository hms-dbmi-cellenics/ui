const plotDataLoading = (state, action) => {
  const { plotUuid } = action.payload;
  return {
    ...state,
    [plotUuid]: {
      ...state[plotUuid],
      loading: true,
      error: false,
    },
  };
};

export default plotDataLoading;

const loadPlotConfig = (state, action) => {
  const { plotUuid, ...rest } = action.payload;
  return {
    ...state,
    [plotUuid]: {
      ...state[plotUuid],
      ...rest,
      outstandingChanges: false,
    },
  };
};

export default loadPlotConfig;

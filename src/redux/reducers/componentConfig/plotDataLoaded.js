const plotDataLoaded = (state, action) => {
  const { plotUuid, plotData } = action.payload;
  return {
    ...state,
    [plotUuid]: {
      ...state[plotUuid],
      plotData: {
        ...state[plotUuid].plotData,
        ...plotData,
      },
      loading: false,
      error: false,
    },
  };
};

export default plotDataLoaded;

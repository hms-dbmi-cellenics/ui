const loadData = (state, action) => {
  const { plotUuid, plotData } = action.payload;
  return {
    ...state,
    [plotUuid]: {
      ...state[plotUuid],
      plotData,
    },
  };
};

export default loadData;

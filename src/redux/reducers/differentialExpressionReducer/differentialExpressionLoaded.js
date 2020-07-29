
const differentialExpressionLoaded = (state, action) => {
  const { data, total, cellSets } = action.payload;

  return {
    ...state,

    properties: {
      ...state.properties,
      data,
      loading: false,
      total,
      cellSets,
    },
  };
};

export default differentialExpressionLoaded;

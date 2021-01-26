const differentialExpressionLoaded = (state, action) => {
  const {
    data, total, comparisonType, cellSets,
  } = action.payload;

  return {
    ...state,

    properties: {
      ...state.properties,
      data,
      loading: false,
      total,
      cellSets,
      comparisonType,
    },
  };
};

export default differentialExpressionLoaded;

const differentialExpressionLoaded = (state, action) => {
  const {
    data, total, comparisonType, comparisonGroup,
  } = action.payload;

  return {
    ...state,

    properties: {
      ...state.properties,
      data,
      loading: false,
      total,
      comparisonGroup,
      comparisonType,
    },
  };
};

export default differentialExpressionLoaded;

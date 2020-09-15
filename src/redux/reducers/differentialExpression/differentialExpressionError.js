const differentialExpressionError = (state, action) => {
  const { error } = action.payload;

  return {
    ...state,
    properties: {
      ...state.properties,
      loading: false,
      error,
    },
  };
};

export default differentialExpressionError;

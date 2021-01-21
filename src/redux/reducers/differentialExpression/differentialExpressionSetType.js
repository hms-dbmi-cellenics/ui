const differentialExpressionSetType = (state, action) => {
  const { type } = action.payload;

  return {
    ...state,
    comparison: {
      ...state.comparison,
      type,
    },
  };
};

export default differentialExpressionSetType;

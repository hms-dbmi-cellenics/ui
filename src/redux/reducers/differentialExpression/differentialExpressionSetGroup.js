const differentialExpressionSetGroup = (state, action) => {
  const { cellSet, basis, compareWith } = action.payload;

  return {
    ...state,
    comparison: {
      ...state.comparison,
      group: {
        cellSet,
        compareWith,
        basis,
      },
    },
  };
};

export default differentialExpressionSetGroup;

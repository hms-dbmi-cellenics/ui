const differentialExpressionSetGroup = (state, action) => {
  const {
    cellSet, basis, compareWith, type,
  } = action.payload;

  return {
    ...state,
    comparison: {
      ...state.comparison,
      type,
      group: {
        ...state.comparison.group,
        [type]: {
          cellSet,
          compareWith,
          basis,
        },
      },
    },
  };
};

export default differentialExpressionSetGroup;

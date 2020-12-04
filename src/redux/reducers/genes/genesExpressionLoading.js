const genesExpressionLoading = (state, action) => {
  const { genes } = action.payload;

  return {
    ...state,
    expression: {
      ...state.expression,
      loading: genes,
      error: false,
    },
  };
};

export default genesExpressionLoading;

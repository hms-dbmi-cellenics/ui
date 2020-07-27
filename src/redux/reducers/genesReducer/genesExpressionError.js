const genesExpressionError = (state, action) => {
  const { error } = action.payload;

  return {
    ...state,
    expression: {
      ...state.expression,
      loading: [],
      error,
    },
  };
};

export default genesExpressionError;

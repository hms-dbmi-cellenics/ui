const genesExpressionTypeUpdate = (state, action) => {
  const {
    expressionType,
  } = action.payload;

  return {
    ...state,
    expression: {
      ...state.expression,
      expressionType,
    },
  };
};

export default genesExpressionTypeUpdate;

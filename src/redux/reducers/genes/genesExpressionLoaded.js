const genesExpressionLoaded = (state, action) => {
  const { data } = action.payload;

  return {
    ...state,
    expression: {
      ...state.expression,
      loading: [],
      data: {
        ...state.expression.data,
        ...data,
      },
    },
  };
};

export default genesExpressionLoaded;

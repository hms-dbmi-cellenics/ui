const heatmapExpressionError = (state, action) => {
  const { error } = action.payload;

  return {
    ...state,
    expression: {
      ...state.expression,
      downsampled: {
        ...state.expression.downsampled,
        loading: false,
        error,
      },
    },
  };
};

export default heatmapExpressionError;

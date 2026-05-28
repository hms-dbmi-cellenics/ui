const heatmapExpressionLoading = (state) => ({
  ...state,
  expression: {
    ...state.expression,
    downsampled: {
      ...state.expression.downsampled,
      loading: true,
      error: false,
    },
  },
});

export default heatmapExpressionLoading;

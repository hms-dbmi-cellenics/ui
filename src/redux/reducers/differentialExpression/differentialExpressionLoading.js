const differentialExpressionLoading = (state, action) => ({
  ...state,
  properties: {
    ...state.properties,
    loading: true,
    error: false,
  },
  comparison: {
    ...state.comparison,
    advancedFilters: action.payload.advancedFilters,
  },
});

export default differentialExpressionLoading;

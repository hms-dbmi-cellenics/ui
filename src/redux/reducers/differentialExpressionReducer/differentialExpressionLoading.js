
const differentialExpressionLoading = (state) => ({
  ...state,
  properties: {
    ...state.properties,
    loading: true,
    error: false,
  },
});

export default differentialExpressionLoading;

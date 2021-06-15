const experimentLoading = (state) => ({
  ...state,
  meta: {
    ...state.meta,
    loading: true,
    error: false,
  },
});

export default experimentLoading;

const samplesLoading = (state) => ({
  ...state,
  meta: {
    ...state.meta,
    loading: true,
  },
});
export default samplesLoading;

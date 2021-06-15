const samplesSaved = (state) => ({
  ...state,
  meta: {
    ...state.meta,
    saving: false,
  },
});

export default samplesSaved;

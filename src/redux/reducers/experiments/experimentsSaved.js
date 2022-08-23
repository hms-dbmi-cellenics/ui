const experimentsSaved = (state) => ({
  ...state,
  meta: {
    ...state.meta,
    saving: false,
  },
});

export default experimentsSaved;

const experimentSaving = (state) => ({
  ...state,
  meta: {
    ...state.meta,
    saving: false,
    error: false,
  },
});

export default experimentSaving;

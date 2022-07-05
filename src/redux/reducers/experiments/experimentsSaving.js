const experimentSaving = (state) => ({
  ...state,
  meta: {
    ...state.meta,
    saving: true,
    error: false,
  },
});

export default experimentSaving;

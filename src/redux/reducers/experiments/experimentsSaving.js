const experimentSaving = (state) => ({
  ...state,
  meta: {
    ...state.meta,
    saving: false,
  },
});

export default experimentSaving;

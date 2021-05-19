const experimentSaved = (state) => ({
  ...state,
  meta: {
    ...state.meta,
    saving: false,
  },
});

export default experimentSaved;

const experimentCreate = (state, action) => {
  const { experiment } = action.payload;

  return {
    ...state,
    ids: [...state.ids, experiment.id],
    [experiment.id]: experiment,
    meta: {
      ...state.meta,
      saving: false,
    },
  };
};

export default experimentCreate;

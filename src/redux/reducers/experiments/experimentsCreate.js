const experimentCreate = (state, action) => {
  const { experiment } = action.payload;

  return {
    ...state,
    ids: [...state.ids, experiment.id],
    [experiment.id]: experiment,
  };
};

export default experimentCreate;

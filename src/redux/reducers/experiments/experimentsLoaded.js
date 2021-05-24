const experimentsLoaded = (state, action) => {
  const { experiments } = action.payload;

  const newExperiments = experiments.reduce((acc, curr) => ({
    ...acc,
    ids: [...acc.ids, curr.experimentId],
    [curr.experimentId]: curr,
  }), { ids: [...state.ids] });

  return {
    ...state,
    ...newExperiments,
    meta: {
      ...state.meta,
      loading: false,
    },
  };
};

export default experimentsLoaded;

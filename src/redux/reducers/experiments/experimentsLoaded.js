const experimentsLoaded = (state, action) => {
  const { experiments } = action.payload;

  const newExperiments = experiments.reduce((acc, curr) => ({
    ...acc,
    ids: [...acc.ids, curr.experimentId],
    [curr.experimentId]: {
      projectUuid: curr.projectId,
      name: curr.experimentName,
      description: curr.description,
      id: curr.experimentId,
      createdAt: curr.createdAt,
      lastViewed: curr.lastViewed,
    },
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

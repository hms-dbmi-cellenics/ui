const experimentsLoaded = (state, action) => {
  const { experiments } = action.payload;

  const newExperiments = experiments.reduce((acc, curr) => {
    acc.ids.push(curr.experimentId);

    acc[curr.experimentId] = {
      projectUuid: curr.projectId,
      name: curr.experimentName,
      description: curr.description,
      id: curr.experimentId,
      createdAt: curr.createdAt,
      lastViewed: curr.lastViewed,
    };

    return acc;
  });

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

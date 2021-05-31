const experimentsLoaded = (state, action) => {
  const { experiments } = action.payload;

  const newExperiments = experiments.reduce((acc, curr) => {
    if (!acc.ids.includes(curr.experimentId)) acc.ids.push(curr.experimentId);

    acc[curr.experimentId] = {
      projectUuid: curr.projectId,
      name: curr.experimentName,
      description: curr.description,
      id: curr.experimentId,
      createdDate: curr.createdDate,
      lastViewed: curr.lastViewed,
    };

    return acc;
  }, { ids: [...state.ids] });

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

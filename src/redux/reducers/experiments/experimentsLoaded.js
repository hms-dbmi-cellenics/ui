const convertedToUIModel = (experiment) => ({
  ...experiment,
  id: experiment.experimentId,
  name: experiment.experimentName,
  projectUuid: experiment.projectId,
});

const experimentsLoaded = (state, action) => {
  const { experiments } = action.payload;

  const newExperiments = experiments.reduce((acc, curr) => {
    if (!acc.ids.includes(curr.experimentId)) acc.ids.push(curr.experimentId);

    const uiModelExp = convertedToUIModel(curr);

    acc[curr.experimentId] = {
      projectUuid: uiModelExp.projectUuid,
      name: uiModelExp.name,
      description: uiModelExp.description,
      id: uiModelExp.id,
      createdDate: uiModelExp.createdDate,
      meta: uiModelExp.meta,
      sampleIds: uiModelExp.sampleIds,
      notifyByEmail: curr.notifyByEmail,
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

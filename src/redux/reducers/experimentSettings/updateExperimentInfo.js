const updateExperimentInfo = (state, action) => {
  const {
    experimentId,
    experimentName,
    projectId,
  } = action.payload;

  return {
    ...state,
    info: {
      ...state.info,
      experimentId,
      experimentName,
      projectUuid: projectId,
    },
  };
};

export default updateExperimentInfo;

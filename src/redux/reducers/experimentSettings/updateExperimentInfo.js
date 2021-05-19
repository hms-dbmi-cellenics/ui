const updateExperimentInfo = (state, action) => {
  const {
    experimentId,
    experimentName,
    projectUuid,
  } = action.payload;

  return {
    ...state,
    info: {
      ...state.info,
      experimentId,
      experimentName,
      projectUuid,
    },
  };
};

export default updateExperimentInfo;

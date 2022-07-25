const projectsSetActive = (state, action) => {
  const { experimentId } = action.payload;
  return {
    ...state,
    meta: {
      ...state.meta,
      activeExperimentId: experimentId,
    },
  };
};

export default projectsSetActive;

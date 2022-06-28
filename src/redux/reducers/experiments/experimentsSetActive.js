const projectsSetActive = (state, action) => {
  const { projectUuid } = action.payload;
  return {
    ...state,
    meta: {
      ...state.meta,
      activeExperimentId: projectUuid,
    },
  };
};

export default projectsSetActive;

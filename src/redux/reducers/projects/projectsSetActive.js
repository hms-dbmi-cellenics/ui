const projectsSetActive = (state, action) => {
  const { projectUuid } = action.payload;
  return {
    ...state,
    meta: {
      ...state.meta,
      activeProject: projectUuid,
    },
  };
};

export default projectsSetActive;

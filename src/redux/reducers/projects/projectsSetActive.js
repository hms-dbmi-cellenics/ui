const projectsSetActive = (state, action) => {
  const { projectUuid } = action.payload;
  return {
    ...state,
    meta: {
      ...state.meta,
      activeProjectUuid: projectUuid,
    },
  };
};

export default projectsSetActive;

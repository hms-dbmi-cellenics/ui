const projectsLoaded = (state, action) => {
  const { projects, ids } = action.payload;

  const newProjects = {};
  projects.forEach((project) => {
    newProjects[project.uuid] = project;
  });

  let activeProjectId = state.meta.activeProjectUuid;

  // If the current active project no longer exists, change it
  if (!Object.keys(state).includes(activeProjectId)) {
    activeProjectId = projects[0]?.uuid;
  }

  return {
    ...state,
    ids,
    loading: false,
    ...newProjects,
    meta: {
      activeProjectUuid: activeProjectId,
    },
  };
};
export default projectsLoaded;

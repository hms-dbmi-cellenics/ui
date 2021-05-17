const projectsLoaded = (state, action) => {
  const { projects, ids } = action.payload;

  const newProjects = {};
  projects.forEach((project) => {
    newProjects[project.uuid] = project;
  });

  return {
    ...state,
    ids,
    loading: false,
    ...newProjects,
    meta: {
      activeProjectUuid: projects[0]?.uuid,
    },
  };
};
export default projectsLoaded;

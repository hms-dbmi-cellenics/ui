const projectsLoad = (state, action) => {
  const { projects, ids } = action.payload;

  const newProjects = {};
  projects.forEach((project) => {
    newProjects[project.uuid] = project;
  });

  return {
    ...state,
    ids,
    ...newProjects,
    meta: {
      activeProjectUuid: projects[0]?.uuid,
    },
  };
};
export default projectsLoad;

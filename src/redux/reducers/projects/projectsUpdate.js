const projectsUpdate = (state, action) => {
  const { project } = action.payload;
  return {
    ...state,
    [project.uuid]: project,
  };
};

export default projectsUpdate;

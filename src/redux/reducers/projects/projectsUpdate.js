const projectsUpdate = (state, action) => {
  const { projectUuid, project } = action.payload;

  return {
    ...state,
    [projectUuid]: {
      ...state[projectUuid],
      ...project,
    },
  };
};

export default projectsUpdate;

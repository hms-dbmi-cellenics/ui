const projectsUpdate = (state, action) => {
  const { projectUuid, diff } = action.payload;
  return {
    ...state,
    [projectUuid]: {
      ...state[projectUuid],
      ...diff,
    },
  };
};

export default projectsUpdate;

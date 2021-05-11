const projectsUpdate = (state, action) => {
  const { projectUuid, sample } = action.payload;
  return {
    ...state,
    [projectUuid]: {
      ...state[projectUuid],
      ...sample,
    },
  };
};

export default projectsUpdate;

const experimentUpdate = (state, action) => {
  const { experimentId, experiment } = action.payload;

  return {
    ...state,
    [experimentId]: {
      ...state[experimentId],
      ...experiment,
    },
  };
};

export default experimentUpdate;

const experimentUpdate = (state, action) => {
  const { experimentId, experiment } = action.payload;

  if (!state?.[experimentId]) return state;

  return {
    ...state,
    [experimentId]: {
      ...state[experimentId],
      ...experiment,
    },
  };
};

export default experimentUpdate;

const experimentUpdate = (state, action) => {
  const { experimentId, experiment } = action.payload;

  return {
    ...state,
    meta: {
      ...state.meta,
      saving: false,
    },
    [experimentId]: {
      ...state[experimentId],
      ...experiment,
    },
  };
};

export default experimentUpdate;

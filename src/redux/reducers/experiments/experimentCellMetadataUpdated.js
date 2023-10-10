const experimentCellMetadataUpdated = (state, action) => {
  const { experimentId, cellLevelMetadata } = action.payload;

  return {
    ...state,
    meta: {
      ...state.meta,
      saving: false,
    },
    [experimentId]: {
      ...state[experimentId],
      cellLevelMetadata: {
        ...state[experimentId].cellLevelMetadata,
        ...cellLevelMetadata,
      },
    },
  };
};

export default experimentCellMetadataUpdated;

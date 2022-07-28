const experimentsMetadataDelete = (state, action) => {
  const { key, experimentId } = action.payload;

  return {
    ...state,
    [experimentId]: {
      ...state[experimentId],
      metadataKeys: [
        ...state[experimentId].metadataKeys.filter((value) => value !== key),
      ],
    },
  };
};

export default experimentsMetadataDelete;

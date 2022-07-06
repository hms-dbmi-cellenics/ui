const experimentsMetadataCreate = (state, action) => {
  const { key, experimentId } = action.payload;

  return {
    ...state,
    [experimentId]: {
      ...state[experimentId],
      metadataKeys: [
        ...state[experimentId].metadataKeys,
        key,
      ],
    },
  };
};

export default experimentsMetadataCreate;

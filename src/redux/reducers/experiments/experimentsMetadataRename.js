const experimentsMetadataRename = (state, action) => {
  const { oldKey, newKey, experimentId } = action.payload;

  return {
    ...state,
    [experimentId]: {
      ...state[experimentId],
      metadataKeys: [
        ...state[experimentId].metadataKeys.filter((value) => value !== oldKey),
        newKey,
      ],
    },
  };
};

export default experimentsMetadataRename;

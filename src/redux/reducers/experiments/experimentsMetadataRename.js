const experimentsMetadataRename = (state, action) => {
  const { oldKey, newKey, experimentId } = action.payload;

  const { metadataKeys } = state[experimentId];

  const newMetadataKeys = metadataKeys.map((metadataKey) => (
    metadataKey === oldKey ? newKey : metadataKey
  ));

  return {
    ...state,
    [experimentId]: {
      ...state[experimentId],
      metadataKeys: newMetadataKeys,
    },
  };
};

export default experimentsMetadataRename;

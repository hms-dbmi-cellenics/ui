const samplesMetadataDelete = (state, action) => {
  const { sampleUuid, metadataKey } = action.payload;

  const newMetadata = state[sampleUuid].metadata;
  delete newMetadata[metadataKey];

  return {
    ...state,
    [sampleUuid]: {
      ...state[sampleUuid],
      metadataKey,
    },
  };
};

export default samplesMetadataDelete;

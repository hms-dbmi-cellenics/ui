const samplesMetadataDelete = (state, action) => {
  const { sampleUuid, metadataKey } = action.payload;

  const newMetadata = state[sampleUuid].metadata;
  delete newMetadata[metadataKey];

  return {
    ...state,
    [sampleUuid]: {
      ...state[sampleUuid],
      metadata: newMetadata,
    },
  };
};

export default samplesMetadataDelete;

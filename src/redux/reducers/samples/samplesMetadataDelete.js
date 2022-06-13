import _ from 'lodash';

const samplesMetadataDelete = (state, action) => {
  const { sampleUuid, metadataKey } = action.payload;

  const newMetadata = _.cloneDeep(state[sampleUuid].metadata);
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

/* eslint-disable no-param-reassign */
import produce from 'immer';

const samplesValueInMetadataTrackUpdated = produce((draft, action) => {
  const { sampleUuid, key, value } = action.payload;

  draft[sampleUuid].metadata[key] = value;
  draft.meta.saving = false;
  draft.meta.error = false;
});

export default samplesValueInMetadataTrackUpdated;

/* eslint-disable no-param-reassign */
import produce, { original } from 'immer';

const experimentsMetadataRename = produce((draft, action) => {
  const { oldKey, newKey, experimentId } = action.payload;

  const { meta, ...samples } = original(draft);

  const sampleEntries = Object.entries(samples);

  const sampleIdsFromExperiment = sampleEntries
    .filter(([, { experimentId: currentExpId }]) => currentExpId === experimentId)
    .map(([sampleId]) => sampleId);

  // Move the metadata in oldKey to newKey and then remove the old one
  sampleIdsFromExperiment.forEach((sampleId) => {
    draft[sampleId].metadata[newKey] = draft[sampleId].metadata[oldKey];
    delete draft[sampleId].metadata[oldKey];
  });
});

export default experimentsMetadataRename;

import objectHash from 'object-hash';
import { METADATA_DEFAULT_VALUE } from 'redux/reducers/experiments/initialState';

const generateGem2sParamsHash = (experiment, samples) => {
  if (!experiment || !samples) {
    return false;
  }
  const projectSamples = Object.entries(samples)
    .sort()
    .filter(([key]) => experiment?.sampleIds?.includes(key));
  const existingSampleIds = projectSamples.map(([, sample]) => sample.uuid);

  // Different sample order should not change the hash.
  const orderInvariantSampleIds = [...existingSampleIds].sort();

  const hashParams = {
    organism: null,
    input: { type: '10x' },
    sampleIds: orderInvariantSampleIds,
    sampleNames: orderInvariantSampleIds.map((sampleId) => samples[sampleId].name),
  };

  if (experiment.metadataKeys.length) {
    const orderInvariantProjectMetadataKeys = [...experiment.metadataKeys].sort();

    hashParams.metadata = orderInvariantProjectMetadataKeys.reduce((acc, key) => {
      // Make sure the key does not contain '-' as it will cause failure in GEM2S
      const sanitizedKey = key.replace(/-+/g, '_');

      acc[sanitizedKey] = projectSamples.map(
        ([, sample]) => sample.metadata[key] || METADATA_DEFAULT_VALUE,
      );
      return acc;
    }, {});
  }

  const newHash = objectHash.sha1(
    hashParams,
    { unorderedObjects: true, unorderedArrays: true, unorderedSets: true },
  );

  return newHash;
};

export default generateGem2sParamsHash;

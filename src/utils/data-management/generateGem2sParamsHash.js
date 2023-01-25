import _ from 'lodash';

import objectHash from 'object-hash';
import { METADATA_DEFAULT_VALUE } from 'redux/reducers/experiments/initialState';

const generateGem2sParamsHash = (experiment, samples) => {
  if (!experiment || !samples || Object.keys(samples).length === 1) {
    return false;
  }

  // Different sample order should not change the hash.
  const orderInvariantSampleIds = [...experiment.sampleIds].sort();
  const sampleTechnology = samples[orderInvariantSampleIds[0]]?.type;

  const hashParams = {
    organism: null,
    sampleTechnology,
    sampleIds: orderInvariantSampleIds,
    sampleNames: orderInvariantSampleIds.map(
      (sampleId) => samples[sampleId]?.name,
    ),
    sampleOptions: orderInvariantSampleIds.map(
      (sampleId) => _.cloneDeep(samples[sampleId]?.options),
    ),
  };

  if (experiment.metadataKeys.length) {
    const orderInvariantProjectMetadataKeys = [...experiment.metadataKeys].sort();

    hashParams.metadata = orderInvariantProjectMetadataKeys.reduce((acc, key) => {
      // Make sure the key does not contain '-' as it will cause failure in GEM2S
      const sanitizedKey = key.replace(/-+/g, '_');

      acc[sanitizedKey] = orderInvariantSampleIds.map(
        (sampleId) => samples[sampleId]?.metadata[key] || METADATA_DEFAULT_VALUE,
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

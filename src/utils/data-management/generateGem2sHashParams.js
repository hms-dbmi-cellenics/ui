import sha1 from 'crypto-js/sha1';
import Hex from 'crypto-js/enc-hex';
import { DEFAULT_NA } from '../../redux/reducers/projects/initialState';

const generateGem2sHashParams = (project, samples, experiment) => {
  const experimentSamples = project.samples.map((sampleUuid) => samples[sampleUuid]);

  const samplesEntries = Object.entries(experimentSamples);

  // Different sample order should not change the hash.
  const orderInvariantSampleIds = [...experiment.sampleIds].sort();

  const hashParams = {
    organism: experiment.meta.organism,
    input: { type: experiment.meta.type },
    sampleIds: orderInvariantSampleIds,
    sampleNames: orderInvariantSampleIds.map((sampleId) => samples[sampleId].name),
  };

  if (project.metadataKeys.length) {
    hashParams.metadata = project.metadataKeys.reduce((acc, key) => {
      // Make sure the key does not contain '-' as it will cause failure in GEM2S
      const sanitizedKey = key.replace(/-+/g, '_');

      acc[sanitizedKey] = samplesEntries.map(
        ([, sample]) => sample.metadata[key] || DEFAULT_NA,
      );
      return acc;
    }, {});
  }

  return Hex.stringify(sha1(JSON.stringify(hashParams)));
};

export default generateGem2sHashParams;

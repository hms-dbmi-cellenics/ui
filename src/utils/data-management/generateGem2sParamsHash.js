/* eslint-disable no-unused-vars */
import { DEFAULT_NA } from '../../redux/reducers/projects/initialState';
import { browserGenerateDigest } from '../crypt';

const generateGem2sParamsHash = async (project, samples, experiment) => {
  if (!project || !samples || !experiment) {
    return false;
  }
  const projectSamples = Object.entries(samples)
    .filter(([key, _]) => project?.samples?.includes(key));
  const existingSampleIds = projectSamples.map(([_, sample]) => sample.uuid);

  // Different sample order should not change the hash.
  const orderInvariantSampleIds = [...existingSampleIds].sort();

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

      acc[sanitizedKey] = projectSamples.map(
        ([, sample]) => sample.metadata[key] || DEFAULT_NA,
      );
      return acc;
    }, {});
  }

  return browserGenerateDigest(JSON.stringify(hashParams));
};

export default generateGem2sParamsHash;

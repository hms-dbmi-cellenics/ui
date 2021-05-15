// Get all samples and ids for a project
const getProjectSamples = (projects, projectUuid, samples) => {
  const payload = {
    ids: projects[projectUuid]?.samples || [],
  };
  return payload.ids.reduce((acc, sampleUuid) => {
    acc[sampleUuid] = samples[sampleUuid];
    return acc;
  }, payload);
};

export default getProjectSamples;

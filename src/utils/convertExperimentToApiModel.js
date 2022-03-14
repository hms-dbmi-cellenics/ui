// There are some differences between the property naming of elements
// stored in the ui and in the api,
// this is an attempt to deal with this in one single place (the ui)
// We should try to converge to one single model to follow
const convertExperimentToApiModel = (experiment) => {
  const {
    id, name, projectUuid, ...restOfExperiment
  } = experiment;

  const convertedExperiment = {
    ...restOfExperiment,
    experimentId: id,
    experimentName: name,
    projectId: projectUuid,
  };

  return convertedExperiment;
};

export default convertExperimentToApiModel;

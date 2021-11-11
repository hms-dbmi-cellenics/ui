import _ from 'lodash';

// Default platform data
import cellSetsData from '__test__/data/cell_sets.json';
import backendStatusData from '__test__/data/backend_status.json';
import processingConfigData from '__test__/data/processing_config.json';
import generateMockExperimentData from '__test__/test-utils/mockExperimentData';
import experimentsData from '__test__/data/experiments.json';
import projectsData from '__test__/data/projects.json';
import projectSamples from '__test__/data/project_samples.json';
import projectExperiments from '__test__/data/project_experiments.json';

// We need to think more on generating fake data for testing
// A ticket has been created to address this : https://biomage.atlassian.net/browse/BIOMAGE-1553
// import projectsData from '__test__/test-utils/mockProjects';

const promiseResponse = (
  response,
  options = {},
) => Promise.resolve(new Response(response, options));

const statusResponse = (code, body) => Promise.resolve({
  status: code,
  body: JSON.stringify(body),
});

const delayedResponse = (response, delay = 10000, options = {}) => new Promise((resolve) => {
  setTimeout(() => {
    resolve(new Response(response, options));
  }, delay);
});

const workerResponse = (body, error = false) => promiseResponse(JSON.stringify({
  results: [
    {
      body: JSON.stringify(body),
    },
  ],
  response: { error },
}));

const generateDefaultMockAPIResponses = (experimentId, projectUuid = null) => ({
  [`experiments/${experimentId}`]: () => promiseResponse(
    JSON.stringify(generateMockExperimentData(experimentId)),
  ),
  [`experiments/${experimentId}/processingConfig`]: () => promiseResponse(
    JSON.stringify(processingConfigData),
  ),
  [`experiments/${experimentId}/cellSets`]: () => promiseResponse(
    JSON.stringify(cellSetsData),
  ),
  [`experiments/${experimentId}/backendStatus`]: () => promiseResponse(
    JSON.stringify(backendStatusData),
  ),
  '/experiments': () => promiseResponse(
    JSON.stringify(experimentsData),
  ),
  '/projects': () => promiseResponse(
    JSON.stringify(projectsData),
  ),
  [`projects/${projectUuid}/samples`]: () => promiseResponse(
    JSON.stringify(projectSamples),
  ),
  [`/v1/projects/${projectUuid}/experiments`]: () => promiseResponse(
    JSON.stringify(projectExperiments),
  ),

  // We need to think more on generating fake data for testing
  // A ticket has been created to address this : https://biomage.atlassian.net/browse/BIOMAGE-1553
  // projects: () => promiseResponse(
  //   JSON.stringify(projectsData(experimentId)),
  // ),
  // [`/v1/projects/${projectUuid}/experiments`]: () => promiseResponse(
  //   JSON.stringify(generateMockExperimentData(experimentId)),
  // ),
});

const mockAPI = (apiMapping) => (req) => {
  const path = req.url;

  const key = _.find(
    Object.keys(apiMapping),
    (urlStub) => path.endsWith(urlStub),
  );

  if (!key) {
    return statusResponse({
      status: 404,
      body: `Path ${path} is undefined`,
    });
  }

  return apiMapping[key](req);
};

export default mockAPI;
export {
  generateDefaultMockAPIResponses,
  promiseResponse,
  statusResponse,
  workerResponse,
  delayedResponse,
};

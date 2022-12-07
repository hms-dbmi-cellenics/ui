import _ from 'lodash';

// Default platform data
import cellSetsData from '__test__/data/cell_sets.json';
import backendStatusData from '__test__/data/backend_status.json';
import processingConfigData from '__test__/data/processing_config.json';
import mockDemoExperiments from '__test__/test-utils/mockData/mockDemoExperiments.json';

import fake from '__test__/test-utils/constants';

// A ticket has been created to address this : https://biomage.atlassian.net/browse/BIOMAGE-1553
import {
  responseData,
} from '__test__/test-utils/mockData';

const promiseResponse = (
  response,
  options = {},
) => Promise.resolve(new Response(response, options));

const statusResponse = (code, body) => (
  Promise.resolve({
    status: code,
    body: JSON.stringify(body),
  })
);

const delayedResponse = (response, delay = 10000, options = {}) => new Promise((resolve) => {
  setTimeout(() => {
    resolve(new Response(response, options));
  }, delay);
});

const workerResponse = (body) => promiseResponse(body);

const generateDefaultMockAPIResponses = (experimentId) => ({
  [`experiments/${experimentId}`]: () => promiseResponse(
    JSON.stringify(responseData.experiments.find(({ id }) => id === experimentId)),
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
  experiments: () => promiseResponse(
    JSON.stringify(responseData.experiments),
  ),
  [`experiments/${experimentId}/samples`]: () => promiseResponse(
    JSON.stringify(responseData.samples[0]),
  ),
  '/v2/experiments/examples': () => promiseResponse(
    JSON.stringify(mockDemoExperiments),
  ),
  'experiments/clone': () => promiseResponse(
    JSON.stringify(fake.CLONED_EXPERIMENT_ID),
  ),
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

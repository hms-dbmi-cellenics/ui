import _ from 'lodash';

// Defaul platform data
import cellSetsData from '__test__/data/cell_sets.json';
import backendStatusData from '__test__/data/backend_status.json';
import processingConfigData from '__test__/data/processing_config.json';
import mockExperimentData from '__test__/test-utils/experimentData.mock';

const promiseResponse = (
  response,
  options = {},
) => Promise.resolve(new Response(response, options));

const statusResponse = (code, body) => Promise.resolve({
  status: code,
  body: JSON.stringify(body),
});

const workerResponse = (body, error = false) => promiseResponse(JSON.stringify({
  results: [
    {
      body: JSON.stringify(body),
    },
  ],
  response: { error },
}));

const generateDefaultMockAPIResponses = (mockExperimentId) => ({
  [mockExperimentId]: () => promiseResponse(
    JSON.stringify(mockExperimentData),
  ),
  processingConfig: () => promiseResponse(
    JSON.stringify(processingConfigData),
  ),
  '/cellSets': () => promiseResponse(
    JSON.stringify(cellSetsData),
  ),
  '/backendStatus': () => promiseResponse(
    JSON.stringify(backendStatusData),
  ),
});

const mockApi = (apiMapping) => (req) => {
  const path = req.url;

  const key = _.find(
    Object.keys(apiMapping),
    (urlStub) => path.endsWith(urlStub),
  );

  return apiMapping[key](req);
};

export default mockApi;
export {
  generateDefaultMockAPIResponses,
  promiseResponse,
  statusResponse,
  workerResponse,
};

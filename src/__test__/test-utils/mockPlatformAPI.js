import _ from 'lodash';

// Defaul platform data
import cellSetsData from '__test__/data/cell_sets.json';
import backendStatusData from '__test__/data/backend_status.json';
import processingConfigData from '__test__/data/processing_config.json';
import mockExperimentData from '__test__/test-utils/experimentData.mock';

const promiseResponse = (response) => Promise.resolve(new Response(response));
const promiseStatus = (code, body) => Promise.resolve({
  status: code,
  body: JSON.stringify(body),
});

const generateMockApiConfig = (mockExperimentId, customMap = {}) => {
  const defaultMockApiMapping = {
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
  };

  return _.merge(
    defaultMockApiMapping,
    customMap,
  );
};

const mockApi = (experimentId, customMap = {}) => (req) => {
  const path = req.url;

  const apiMapping = generateMockApiConfig(experimentId, customMap);

  const key = _.find(
    Object.keys(apiMapping),
    (urlStub) => path.endsWith(urlStub),
  );

  return apiMapping[key](req);
};

export default mockApi;
export {
  promiseResponse,
  promiseStatus,
};

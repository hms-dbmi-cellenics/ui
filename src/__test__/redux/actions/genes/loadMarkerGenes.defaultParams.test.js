import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import mockAPI, {
  generateDefaultMockAPIResponses,
  promiseResponse,
  workerDataResult,
} from '__test__/test-utils/mockAPI';

import { MD5 } from 'object-hash';
import _ from 'lodash';
import backendStatusData from '__test__/data/backend_status.json';
import createObjectHash from 'utils/work/createObjectHash';
import generateExperimentSettingsMock from '__test__/test-utils/experimentSettings.mock';
import { loadBackendStatus } from 'redux/actions/backendStatus';
import { loadMarkerGenes } from 'redux/actions/genes';
import loadProcessingSettings from 'redux/actions/experimentSettings/processingConfig/loadProcessingSettings';
import { makeStore } from 'redux/store';
import { dispatchWorkRequest } from 'utils/work/seekWorkResponse';
import { loadCellSets } from 'redux/actions/cellSets';

jest.mock('utils/getTimeoutForWorkerTask', () => ({
  __esModule: true, // this property makes it work
  default: () => 60,
}));

enableFetchMocks();

jest.mock('utils/work/seekWorkResponse', () => ({
  __esModule: true, // this property makes it work
  dispatchWorkRequest: jest.fn(),
}));

jest.mock('utils/work/createObjectHash');

const experimentId = '6463cb35-3e08-4e94-a181-6d155a5ca570';
const sampleIds = ['sample-WT', 'sample-WT1', 'sample-KO'];
const initialExperimentSettingsState = generateExperimentSettingsMock(sampleIds);

const experimentSettings = {
  ...initialExperimentSettingsState,
  processing: {
    ...initialExperimentSettingsState.processing,
    configureEmbedding: {
      clusteringSettings: {
        method: 'louvain',
        methodSettings: {
          louvain: {
            resolution: 0.8,
          },
        },
      },
      embeddingSettings: {
        method: 'umap',
        methodSettings: {
          tsne: { perplexity: 30, learningRate: 200 },
          umap: { distanceMetric: 'cosine', minimumDistance: 0.3 },
        },
      },
    },
  },
};

// this is the same Date used in the API to make sure the default ETag generated
// by the UI is identical to the API
const date = new Date(1458619200000);
backendStatusData.pipeline.startDate = date.toISOString();

const customAPIResponses = {
  [`experiments/${experimentId}/processingConfig$`]: () => promiseResponse(JSON.stringify(experimentSettings.processing)),
  [`experiments/${experimentId}/backendStatus$`]: () => promiseResponse(
    JSON.stringify(backendStatusData),
  ),
};

const mockApiResponses = _.merge(
  generateDefaultMockAPIResponses(experimentId), customAPIResponses,
);

describe('loadEmbedding action', () => {
  let store;

  beforeEach(async () => {
    jest.clearAllMocks();
    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockIf(/.*/, mockAPI(mockApiResponses));

    dispatchWorkRequest
      .mockReset()
      .mockImplementationOnce(() => workerDataResult([[1, 2], [3, 4]]));
    createObjectHash.mockImplementation((object) => MD5(object));

    store = makeStore();
    await store.dispatch(loadProcessingSettings(experimentId));
    await store.dispatch(loadBackendStatus(experimentId));
    await store.dispatch(loadCellSets(experimentId));
  });

  it('loadEmbedding generates correct hash params body for ETag', async () => {
    const hashMock = jest.fn((object) => MD5(object));
    createObjectHash.mockImplementation(hashMock);

    await store.dispatch(loadMarkerGenes(experimentId, 'interactiveHeatmap'));

    expect(hashMock).toHaveBeenCalled();
    // this snapshot should max exactly API snapshot:
    // submitMarkerHeatmapWork.test.js.snap
    expect(hashMock.mock.calls).toMatchSnapshot('marker heatmap - hash call params');
    // this ETag should match exactly the one in
    // submitMarkerHeatmap.test.js
    const ETag = hashMock.mock.results[0].value;
    expect(ETag).toEqual('5a0e619279cd36c96c0ffd89d0d86d46'); // pragma: allowlist secret`
  });
});

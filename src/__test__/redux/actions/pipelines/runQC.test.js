import _ from 'lodash';

import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import waitForActions from 'redux-mock-store-await-actions';

import loadBackendStatus from 'redux/actions/backendStatus/loadBackendStatus';
import saveProcessingSettings from 'redux/actions/experimentSettings/processingConfig/saveProcessingSettings';

import {
  EXPERIMENT_SETTINGS_QC_START,
  EXPERIMENT_SETTINGS_DISCARD_CHANGED_QC_FILTERS,
} from 'redux/actionTypes/experimentSettings';

import { EMBEDDINGS_LOADING } from 'redux/actionTypes/embeddings';

import { runQC } from 'redux/actions/pipeline';

import generateExperimentSettingsMock from '__test__/test-utils/experimentSettings.mock';
import '__test__/test-utils/setupTests';

jest.mock('utils/getTimeoutForWorkerTask', () => () => 1);

jest.mock('redux/actions/backendStatus/loadBackendStatus',
  () => jest.fn().mockImplementation(() => async () => { }));

jest.mock('redux/actions/experimentSettings/processingConfig/saveProcessingSettings');

const mockStore = configureStore([thunk]);

enableFetchMocks();

const experimentId = 'experiment-id';
const sampleIds = ['sample1, sample2'];

const initialExperimentState = generateExperimentSettingsMock(sampleIds);

const initialState = {
  experimentSettings: {
    ...initialExperimentState,
    processing: {
      ...initialExperimentState.processing,
      meta: {
        changedQCFilters: new Set(['cellSizeDistribution']),
      },
    },
  },
  backendStatus: {
    [experimentId]: {
      status: {
        pipeline: {
          startDate: '2021-01-01T01:01:01.000Z',
        },
      },
    },
  },
  networkResources: {
    environment: 'testing',
  },
};

describe('runQC action', () => {
  beforeEach(() => {
    const response = new Response(JSON.stringify({}));

    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockResolvedValueOnce(response);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Dispatches events properly', async () => {
    const store = mockStore(initialState);
    await store.dispatch(runQC(experimentId));

    const actions = store.getActions();

    expect(actions[0].type).toEqual(EXPERIMENT_SETTINGS_QC_START);
    expect(loadBackendStatus).toHaveBeenCalled();
    expect(actions).toMatchSnapshot();

    expect(fetchMock.mock.calls[0]).toMatchSnapshot();
  });

  it('Dispatches status error if loading fails', async () => {
    fetchMock.resetMocks();
    fetchMock.mockResponse(
      JSON.stringify({ message: 'some weird error that happened' }), { status: 400 },
    );

    const store = mockStore(initialState);
    await store.dispatch(runQC(experimentId));

    const actions = store.getActions();

    expect(loadBackendStatus).toHaveBeenCalled();

    expect(actions).toMatchSnapshot();
  });

  it('Runs only the embedding if only changed filter was configureEmbedding', async () => {
    fetchMock.resetMocks();

    saveProcessingSettings.mockImplementation(() => () => Promise.resolve());

    const onlyConfigureEmbeddingChangedState = _.cloneDeep(initialState);
    onlyConfigureEmbeddingChangedState.experimentSettings.processing.meta.changedQCFilters = new Set(['configureEmbedding']);

    const store = mockStore(onlyConfigureEmbeddingChangedState);
    await store.dispatch(runQC(experimentId));

    await waitForActions(
      store,
      [EXPERIMENT_SETTINGS_DISCARD_CHANGED_QC_FILTERS, EMBEDDINGS_LOADING],
    );

    const actions = store.getActions();

    expect(actions[0].type).toEqual(EXPERIMENT_SETTINGS_DISCARD_CHANGED_QC_FILTERS);
    expect(actions[1].type).toEqual(EMBEDDINGS_LOADING);

    expect(actions).toMatchSnapshot();
  });
});

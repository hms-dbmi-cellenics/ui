import _ from 'lodash';

import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import loadBackendStatus from '../../../../redux/actions/experimentSettings/backendStatus/loadBackendStatus';

import {
  EXPERIMENT_SETTINGS_BACKEND_STATUS_LOADING,
  EXPERIMENT_SETTINGS_PIPELINE_START,
  EXPERIMENT_SETTINGS_BACKEND_STATUS_ERROR,
  EXPERIMENT_SETTINGS_DISCARD_CHANGED_QC_FILTERS,
} from '../../../../redux/actionTypes/experimentSettings';
import { EMBEDDINGS_LOADING } from '../../../../redux/actionTypes/embeddings';

import { runPipeline } from '../../../../redux/actions/pipeline';

import generateExperimentSettingsMock from '../../../test-utils/experimentSettings.mock';

const mockStore = configureStore([thunk]);

jest.mock('localforage');
enableFetchMocks();

jest.mock('../../../../redux/actions/experimentSettings/backendStatus/loadBackendStatus',
  () => jest.fn().mockImplementation(() => async () => { }));

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
};

describe('runPipeline action', () => {
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
    await store.dispatch(runPipeline(experimentId));

    const actions = store.getActions();

    expect(actions[0].type).toEqual(EXPERIMENT_SETTINGS_BACKEND_STATUS_LOADING);
    expect(actions[1].type).toEqual(EXPERIMENT_SETTINGS_PIPELINE_START);
    expect(loadBackendStatus).toHaveBeenCalled();
    expect(actions).toMatchSnapshot();
  });

  it('Dispatches status error if loading fails', async () => {
    fetchMock.resetMocks();
    fetchMock.mockResponse(JSON.stringify({ message: 'some weird error that happened' }), { status: 400 });

    const store = mockStore(initialState);
    await store.dispatch(runPipeline(experimentId));

    const actions = store.getActions();

    expect(actions[0].type).toEqual(EXPERIMENT_SETTINGS_BACKEND_STATUS_LOADING);
    expect(loadBackendStatus).not.toHaveBeenCalled();
    expect(actions[1].type).toEqual(EXPERIMENT_SETTINGS_BACKEND_STATUS_ERROR);

    expect(actions).toMatchSnapshot();
  });

  it('Runs only the embedding if only changed filter was configureEmbedding', async () => {
    fetchMock.resetMocks();

    const onlyConfigureEmbeddingChangedState = _.cloneDeep(initialState);
    onlyConfigureEmbeddingChangedState.experimentSettings.processing.meta.changedQCFilters = new Set(['configureEmbedding']);

    const store = mockStore(onlyConfigureEmbeddingChangedState);
    await store.dispatch(runPipeline(experimentId));

    const actions = store.getActions();

    expect(actions[0].type).toEqual(EXPERIMENT_SETTINGS_DISCARD_CHANGED_QC_FILTERS);
    expect(actions[1].type).toEqual(EMBEDDINGS_LOADING);

    expect(actions).toMatchSnapshot();
  });
});

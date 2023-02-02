import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import initialExperimentsState, { experimentTemplate } from 'redux/reducers/experiments/initialState';
import loadBackendStatus from 'redux/actions/backendStatus/loadBackendStatus';
import initialBackendState from 'redux/reducers/backendStatus';

import {
  EXPERIMENT_SETTINGS_QC_START,
} from 'redux/actionTypes/experimentSettings';

import { runGem2s } from 'redux/actions/pipeline';

const mockStore = configureStore([thunk]);
enableFetchMocks();

jest.mock('redux/actions/backendStatus/loadBackendStatus',
  () => jest.fn().mockImplementation(() => async () => { }));

const experimentId = 'experiment-id';
const projectId = 'project-id';

const initialState = {
  experiments: {
    ...initialExperimentsState,
    [experimentId]: {
      ...experimentTemplate,
      name: 'Mock experiment',
      id: experimentId,
      experimentId: projectId,
      sampleIds: ['sample-1', 'sample-2'],
    },
  },
  backendStatus: {
    [experimentId]: {
      ...initialBackendState,
      status: {
        gem2s: {
          shouldRerun: false,
        },
      },
    },
  },
};

describe('runGem2s action', () => {
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
    await store.dispatch(runGem2s(experimentId));

    const actions = store.getActions();
    expect(actions[0].type).toEqual(EXPERIMENT_SETTINGS_QC_START);

    expect(loadBackendStatus).toHaveBeenCalled();

    expect(actions).toMatchSnapshot();
  });

  it('Dispatches status error if loading fails', async () => {
    fetchMock.resetMocks();
    fetchMock.mockResponse(JSON.stringify({ message: 'some weird error that happened' }), { status: 400 });

    const store = mockStore(initialState);
    await store.dispatch(runGem2s(experimentId));

    expect(loadBackendStatus).toHaveBeenCalled();
  });

  it('Dispatches properly without project data', async () => {
    const store = mockStore(initialState);
    await store.dispatch(runGem2s(experimentId));

    expect(fetchMock).toHaveBeenCalled();
  });
});

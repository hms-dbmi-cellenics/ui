import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import initialExperimentsState, { experimentTemplate } from '../../../../redux/reducers/experiments/initialState';
import loadBackendStatus from '../../../../redux/actions/experimentSettings/backendStatus/loadBackendStatus';

import {
  EXPERIMENT_SETTINGS_BACKEND_STATUS_LOADING,
  EXPERIMENT_SETTINGS_PIPELINE_START,
  EXPERIMENT_SETTINGS_INFO_UPDATE,
  EXPERIMENT_SETTINGS_BACKEND_STATUS_ERROR,
} from '../../../../redux/actionTypes/experimentSettings';

import { runGem2s } from '../../../../redux/actions/pipeline';

const mockStore = configureStore([thunk]);
enableFetchMocks();

jest.mock('../../../../redux/actions/experimentSettings/backendStatus/loadBackendStatus',
  () => jest.fn().mockImplementation(() => async () => { }));

const experimentId = 'experiment-id';

const initialState = {
  experiments: {
    ...initialExperimentsState,
    [experimentId]: {
      ...experimentTemplate,
      name: 'Mock experiment',
      id: experimentId,
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

    expect(actions[0].type).toEqual(EXPERIMENT_SETTINGS_BACKEND_STATUS_LOADING);
    expect(actions[1].type).toEqual(EXPERIMENT_SETTINGS_PIPELINE_START);
    expect(loadBackendStatus).toHaveBeenCalled();

    expect(actions[2].type).toEqual(EXPERIMENT_SETTINGS_INFO_UPDATE);
    expect(actions).toMatchSnapshot();
  });

  it('Dispatches status error if loading fails', async () => {
    fetchMock.resetMocks();
    fetchMock.mockResponse(JSON.stringify({ message: 'some weird error that happened' }), { status: 400 });

    const store = mockStore(initialState);
    await store.dispatch(runGem2s(experimentId));

    const actions = store.getActions();

    expect(actions[0].type).toEqual(EXPERIMENT_SETTINGS_BACKEND_STATUS_LOADING);
    expect(loadBackendStatus).not.toHaveBeenCalled();
    expect(actions[1].type).toEqual(EXPERIMENT_SETTINGS_BACKEND_STATUS_ERROR);

    expect(actions).toMatchSnapshot();
  });
});

import _ from 'lodash';

import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import initialState from 'redux/reducers/backendStatus/initialState';
import loadBackendStatus from 'redux/actions/backendStatus/loadBackendStatus';
import { BACKEND_STATUS_LOADING, BACKEND_STATUS_LOADED, BACKEND_STATUS_ERROR } from 'redux/actionTypes/backendStatus';

import config from 'config';
import { api } from 'utils/constants';

jest.mock('config');

const mockStore = configureStore([thunk]);

const backendStatusResponse = {
  pipeline: {
    startDate: null,
    stopDate: null,
    status: 'NOT_CREATED',
    error: false,
    completedSteps: [],
  },
  gem2s: {
    startDate: null,
    stopDate: null,
    status: 'NOT_CREATED',
    error: false,
    completedSteps: [],
  },
  worker: {
    status: 'Running',
    started: true,
    ready: true,
    restartCount: 0,
  },
};

describe('loadBackendStatus', () => {
  const experimentId = '1234';

  beforeEach(() => {
    jest.clearAllMocks();

    enableFetchMocks();
    fetchMock.resetMocks();
    fetchMock.doMock();
  });

  it('Works well if fetch works', async () => {
    fetchMock.mockResponseOnce(() => Promise.resolve(JSON.stringify(backendStatusResponse)));
    const store = mockStore({ backendStatus: initialState });

    await store.dispatch(loadBackendStatus(experimentId));

    const actions = store.getActions();
    expect(_.map(actions, 'type')).toEqual([BACKEND_STATUS_LOADING, BACKEND_STATUS_LOADED]);
    expect(_.map(actions, 'payload')).toMatchSnapshot();

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/v2/experiments/1234/backendStatus',
      { headers: {} },
    );
  });

  it('Dispatches error if fetch fails', async () => {
    fetchMock.mockRejectOnce(() => new Error('An api error'));
    const store = mockStore({ backendStatus: initialState });

    await store.dispatch(loadBackendStatus(experimentId));

    const actions = store.getActions();
    expect(_.map(actions, 'type')).toEqual([BACKEND_STATUS_LOADING, BACKEND_STATUS_ERROR]);
    expect(_.map(actions, 'payload')).toMatchSnapshot();

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/v2/experiments/1234/backendStatus',
      { headers: {} },
    );
  });

  it('Works well if fetch works for api v2', async () => {
    config.currentApiVersion = api.V2;
    fetchMock.mockResponseOnce(() => Promise.resolve(JSON.stringify(backendStatusResponse)));
    const store = mockStore({ backendStatus: initialState });

    await store.dispatch(loadBackendStatus(experimentId));

    const actions = store.getActions();
    expect(_.map(actions, 'type')).toEqual([BACKEND_STATUS_LOADING, BACKEND_STATUS_LOADED]);
    expect(_.map(actions, 'payload')).toMatchSnapshot();

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/v2/experiments/1234/backendStatus',
      { headers: {} },
    );
  });

  it('Dispatches error if fetch fails for api v2', async () => {
    fetchMock.mockRejectOnce(() => new Error('An api error'));
    const store = mockStore({ backendStatus: initialState });

    await store.dispatch(loadBackendStatus(experimentId));

    const actions = store.getActions();
    expect(_.map(actions, 'type')).toEqual([BACKEND_STATUS_LOADING, BACKEND_STATUS_ERROR]);
    expect(_.map(actions, 'payload')).toMatchSnapshot();

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/v2/experiments/1234/backendStatus',
      { headers: {} },
    );
  });
});

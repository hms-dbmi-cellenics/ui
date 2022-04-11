import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import pushNotificationMessage from 'utils/pushNotificationMessage';
import {
  EXPERIMENTS_LOADING,
  EXPERIMENTS_LOADED,
  EXPERIMENTS_ERROR,
} from 'redux/actionTypes/experiments';
import { loadExperiments } from 'redux/actions/experiments';

import '__test__/test-utils/setupTests';

enableFetchMocks();

const mockStore = configureStore([thunk]);

describe('loadExperiment', () => {
  const projectUuid = 'project-1';

  beforeEach(() => {
    const response = new Response(JSON.stringify({}));

    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockResolvedValue(response);
  });

  it('Dispatches the correct actions when called', async () => {
    const store = mockStore();
    await store.dispatch(loadExperiments(projectUuid));

    const actions = store.getActions();
    expect(actions[0].type).toEqual(EXPERIMENTS_LOADING);

    expect(actions[1].type).toEqual(EXPERIMENTS_LOADED);
  });

  it('Dispatches notifications when error', async () => {
    fetchMock.mockReject(new Error('some weird error that happened'));

    const store = mockStore();
    await store.dispatch(loadExperiments(projectUuid));

    const actions = store.getActions();
    expect(actions[0].type).toEqual(EXPERIMENTS_LOADING);

    expect(actions[1].type).toEqual(EXPERIMENTS_ERROR);

    expect(pushNotificationMessage).toHaveBeenCalled();
  });
});

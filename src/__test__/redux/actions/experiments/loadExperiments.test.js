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

enableFetchMocks();

const mockStore = configureStore([thunk]);

const experiment = {
  id: '03a9af8d-17ae-9caf-ace5-1152f4241eb2',
  name: 'Bone marrow analysis',
  description: '',
  samplesOrder: [
    '51ffbd1e-a156-46e7-a380-039c2999a5b5',
  ],
  notifyByEmail: true,
  createdAt: '2021-06-29 09:34:48.793+00',
  updatedAt: '2022-01-17 15:06:22.267+00',
};

const dispatchedExperiment = {
  id: experiment.id,
  name: experiment.name,
  description: experiment.description,
  sampleIds: experiment.samplesOrder,
  notifyByEmail: experiment.notifyByEmail,
  createdAt: experiment.createdAt,
  updatedAt: experiment.updatedAt,
};

describe('loadExperiments', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    fetchMock.resetMocks();
    fetchMock.doMock();
  });

  it('Dispatches the correct actions when called', async () => {
    const experimentId = 'experiment-1';

    fetchMock.mockResolvedValue(new Response(JSON.stringify([experiment])));

    const store = mockStore();
    await store.dispatch(loadExperiments(experimentId));

    const actions = store.getActions();
    expect(actions[0].type).toEqual(EXPERIMENTS_LOADING);

    expect(actions[1].type).toEqual(EXPERIMENTS_LOADED);
    expect(actions[1].payload.experiments).toEqual([dispatchedExperiment]);
  });

  it('Dispatches notifications when error', async () => {
    const experimentId = 'experiment-1';

    fetchMock.mockReject(new Error('some weird error that happened'));

    const store = mockStore();
    await store.dispatch(loadExperiments(experimentId));

    const actions = store.getActions();

    expect(actions[0].type).toEqual(EXPERIMENTS_LOADING);
    expect(actions[1].type).toEqual(EXPERIMENTS_ERROR);

    expect(pushNotificationMessage).toHaveBeenCalled();
  });
});

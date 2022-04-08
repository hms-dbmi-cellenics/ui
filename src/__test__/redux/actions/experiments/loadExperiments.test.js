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

import { api } from 'utils/constants';
import config from 'config';

jest.mock('config');

enableFetchMocks();

const mockStore = configureStore([thunk]);

const v1Experiment = [
  {
    experimentId: '03a9af8d-17ae-9caf-ace5-1152f4241eb2',
    projectId: '03a9af8d-17ae-9caf-ace5-1152f4241eb2',
    description: '',
    experimentName: 'Bone marrow analysis',
    createdDate: '2021-06-29 09:34:48.793+00',
    notifyByEmail: true,
    sampleIds: [
      '51ffbd1e-a156-46e7-a380-039c2999a5b5',
    ],
    meta: {
      organism: null,
      type: '10x',
      gem2s: {
        paramsHash: 'paramsHash',
        executionArn: 'executionArnGem2s',
        stateMachineArn: 'stateMachineArnGem2s',
      },
      pipeline: {
        paramsHash: null,
        executionArn: 'executionArnPipeline',
        stateMachineArn: 'stateMachineArnPipeline',
      },
    },
  },
];

const v2Experiment = {
  id: '03a9af8d-17ae-9caf-ace5-1152f4241eb2',
  name: 'Bone marrow analysis',
  description: '',
  samplesOrder: [
    '51ffbd1e-a156-46e7-a380-039c2999a5b5',
  ],
  notifyByEmail: true,
  createdAt: '2021-06-29 09:34:48.793+00',
  updatedAt: '2022-01-17 15:06:22.267+00',
  pipelines: {
    qc: {
      paramsHash: null,
      executionArn: 'executionArnPipeline',
      stateMachineArn: 'stateMachineArnPipeline',
    },
    gem2s: {
      paramsHash: 'paramsHash',
      executionArn: 'executionArnGem2s',
      stateMachineArn: 'stateMachineArnGem2s',
    },
  },
};

describe('loadExperiment', () => {
  const projectUuid = 'project-1';

  beforeEach(() => {
    jest.clearAllMocks();

    fetchMock.resetMocks();
    fetchMock.doMock();
  });

  it('Dispatches the correct actions when called', async () => {
    const response = new Response(JSON.stringify({}));
    fetchMock.mockResolvedValue(response);

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

  it('Dispatches the correct actions when called in api v2', async () => {
    config.currentApiVersion = api.V2;
    const experimentId = 'experiment-1';

    fetchMock.mockResolvedValue(new Response(JSON.stringify(v2Experiment)));

    const store = mockStore();
    await store.dispatch(loadExperiments(experimentId));

    const actions = store.getActions();
    expect(actions[0].type).toEqual(EXPERIMENTS_LOADING);

    expect(actions[1].type).toEqual(EXPERIMENTS_LOADED);
    expect(actions[1].payload.experiments).toEqual(v1Experiment);
  });

  it('Dispatches notifications when error in api v2', async () => {
    config.currentApiVersion = api.V2;
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

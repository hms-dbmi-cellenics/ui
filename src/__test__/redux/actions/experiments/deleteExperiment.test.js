import _ from 'lodash';

import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import deleteExperiment from 'redux/actions/experiments/deleteExperiment';

import initialSampleState, { sampleTemplate } from 'redux/reducers/samples/initialState';
import initialExperimentState, { experimentTemplate } from 'redux/reducers/experiments/initialState';

import { EXPERIMENTS_SET_ACTIVE, EXPERIMENTS_DELETED, EXPERIMENTS_SAVING } from 'redux/actionTypes/experiments';
import { SAMPLES_DELETE } from 'redux/actionTypes/samples';

enableFetchMocks();

const mockStore = configureStore([thunk]);

describe('deleteExperiment action', () => {
  const mockSampleUuid1 = 'sample-1';
  const mockSampleUuid2 = 'sample-2';
  const mockExperimentId1 = 'experiment-1';
  const mockExperimentId2 = 'experiment-2';

  const mockSample = {
    ...sampleTemplate,
    name: 'test sample',
    projectUuid: mockExperimentId1,
    uuid: mockSampleUuid1,
  };

  const mockExperiment = {
    ...experimentTemplate,
    name: 'test experiment',
    sampleIds: [mockSampleUuid1],
  };

  const initialStateUniSample = {
    samples: {
      ...initialSampleState,
      ids: [mockSampleUuid1],
      [mockSampleUuid1]: mockSample,
    },
    experiments: {
      ...initialExperimentState,
      [mockExperimentId1]: mockExperiment,
      ids: [mockExperimentId1],
    },
  };

  const initialStateMultipleSamples = {
    samples: {
      ...initialSampleState,
      ids: [mockSampleUuid1],
      [mockSampleUuid1]: mockSample,
      [mockSampleUuid2]: {
        mockSample,
        uuid: mockSampleUuid2,
      },
    },
    experiments: {
      ...initialExperimentState,
      ids: [mockExperimentId1],
      [mockExperimentId1]: {
        ...mockExperiment,
        sampleIds: [
          mockExperiment.sampleIds,
          mockSampleUuid2,
        ],
      },
    },
  };

  const initialStateMultipleExperiments = {
    experiments: {
      ...initialExperimentState,
      meta: { activeExperimentId: mockExperimentId1 },
      ids: [mockExperimentId1, mockExperimentId2],
      [mockExperimentId1]: mockExperiment,
      [mockExperimentId2]: {
        ...mockExperiment,
        id: mockExperimentId2,
      },
    },
  };

  beforeEach(async () => {
    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockResponse(JSON.stringify({}));
  });

  it('Dispatches event correctly for one sample', async () => {
    const store = mockStore(initialStateUniSample);
    await store.dispatch(deleteExperiment(mockExperimentId1));

    // Sets up loading state for saving experiment
    const actions = store.getActions();
    expect(_.map(actions, 'type')).toEqual([
      EXPERIMENTS_SAVING, SAMPLES_DELETE, EXPERIMENTS_DELETED,
    ]);

    expect(fetchMock).toHaveBeenCalledWith(
      `http://localhost:3000/v2/experiments/${mockExperimentId1}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  });

  it('Dispatches event correctly for multiple samples', async () => {
    const store = mockStore(initialStateMultipleSamples);
    await store.dispatch(deleteExperiment(mockExperimentId1));

    // Sets up loading state for saving experiment
    const actions = store.getActions();
    expect(_.map(actions, 'type')).toEqual([
      EXPERIMENTS_SAVING, SAMPLES_DELETE, EXPERIMENTS_DELETED,
    ]);
  });

  it('Switches to activeExperimentId to another experiment if multiple experiment exists', async () => {
    const store = mockStore(initialStateMultipleExperiments);
    await store.dispatch(deleteExperiment(mockExperimentId1));

    // Sets up loading state for saving experiment
    const actions = store.getActions();
    expect(_.map(actions, 'type')).toEqual([
      EXPERIMENTS_SAVING, EXPERIMENTS_SET_ACTIVE, SAMPLES_DELETE, EXPERIMENTS_DELETED,
    ]);
  });
});

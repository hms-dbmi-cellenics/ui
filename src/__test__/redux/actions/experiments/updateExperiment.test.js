import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import {
  EXPERIMENTS_ERROR,
  EXPERIMENTS_SAVED,
  EXPERIMENTS_SAVING,
  EXPERIMENTS_UPDATED,
} from 'redux/actionTypes/experiments';
import { updateExperiment } from 'redux/actions/experiments';
import initialExperimentState, { experimentTemplate } from 'redux/reducers/experiments/initialState';

import config from 'config';
import { api } from 'utils/constants';

import '__test__/test-utils/setupTests';

jest.mock('config');

const mockStore = configureStore([thunk]);

enableFetchMocks();

describe('updateExperiment', () => {
  const experimentId = 'experiment-1';

  const mockExperiment = {
    ...experimentTemplate,
    name: 'experiment-1',
    id: experimentId,
  };

  const updatedExperiment = {
    ...mockExperiment,
    name: 'updated-experiment',
  };

  const mockState = {
    experiments: {
      ...initialExperimentState,
      [experimentId]: mockExperiment,
    },
  };

  beforeEach(() => {
    const response = new Response(JSON.stringify({}));

    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockResolvedValueOnce(response);
  });

  it('Dispatches actions when called', async () => {
    config.currentApiVersion = api.V1;

    const store = mockStore(mockState);
    await store.dispatch(updateExperiment(experimentId, updatedExperiment));

    const actions = store.getActions();

    expect(actions[0].type).toEqual(EXPERIMENTS_SAVING);

    // Updates the experiments
    expect(actions[1].type).toEqual(EXPERIMENTS_UPDATED);

    // Switches the loading to false
    expect(actions[2].type).toEqual(EXPERIMENTS_SAVED);

    expect(actions).toMatchSnapshot();

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/v1/experiments/experiment-1',
      expect.objectContaining({
        method: 'PUT',
      }),
    );

    expect(fetchMock.mock.calls[0][1].body).toMatchSnapshot();
  });

  it('Errors out and doesn\'t send request if an attempt to update sampleIds with this action creator is made', async () => {
    config.currentApiVersion = api.V2;

    const store = mockStore(mockState);
    await store.dispatch(updateExperiment(experimentId, { sampleIds: ['1', '2', '4'] }));

    const actions = store.getActions();
    expect(actions[0].type).toEqual(EXPERIMENTS_SAVING);
    expect(actions[1].type).toEqual(EXPERIMENTS_ERROR);
    expect(actions).toMatchSnapshot();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('Updates properties with api v2 correctly', async () => {
    config.currentApiVersion = api.V2;

    const store = mockStore(mockState);
    await store.dispatch(updateExperiment(experimentId, { name: 'newName' }));

    const actions = store.getActions();

    expect(actions[0].type).toEqual(EXPERIMENTS_SAVING);

    // Updates the experiments
    expect(actions[1].type).toEqual(EXPERIMENTS_UPDATED);

    // Switches the loading to false
    expect(actions[2].type).toEqual(EXPERIMENTS_SAVED);

    expect(actions).toMatchSnapshot();

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/v2/experiments/experiment-1',
      expect.objectContaining({
        method: 'PATCH',
      }),
    );

    expect(fetchMock.mock.calls[0][1].body).toMatchSnapshot();
  });
});

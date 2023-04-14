import _ from 'lodash';

import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import {
  EXPERIMENTS_ERROR,
  EXPERIMENTS_SAVING,
  EXPERIMENTS_UPDATED,
} from 'redux/actionTypes/experiments';
import { updateExperiment } from 'redux/actions/experiments';
import initialExperimentState, { experimentTemplate } from 'redux/reducers/experiments/initialState';

const mockStore = configureStore([thunk]);

enableFetchMocks();

describe('updateExperiment', () => {
  const experimentId = 'experiment-1';

  const mockExperiment = {
    ...experimentTemplate,
    name: 'experiment-1',
    id: experimentId,
  };

  const mockState = {
    experiments: {
      ...initialExperimentState,
      [experimentId]: mockExperiment,
    },
  };

  beforeEach(() => {
    fetchMock.resetMocks();
    fetchMock.doMock();
  });

  it('Works correctly', async () => {
    const store = mockStore(mockState);
    const response = new Response(JSON.stringify({}));
    fetchMock.mockResolvedValueOnce(response);

    await store.dispatch(updateExperiment(experimentId, { name: 'newName' }));

    const actions = store.getActions();

    expect(actions[0].type).toEqual(EXPERIMENTS_SAVING);

    // Updates the experiments
    expect(actions[1].type).toEqual(EXPERIMENTS_UPDATED);

    expect(actions).toMatchSnapshot();

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/v2/experiments/experiment-1',
      expect.objectContaining({
        method: 'PATCH',
      }),
    );

    expect(fetchMock.mock.calls[0][1].body).toMatchSnapshot();
  });

  it('Handles error if api request fails', async () => {
    const store = mockStore(mockState);

    fetchMock.mockRejectOnce(new Error('Api error'));

    await store.dispatch(updateExperiment(experimentId, { name: 'newName' }));

    const actions = store.getActions();
    expect(_.map(actions, 'type')).toEqual([EXPERIMENTS_SAVING, EXPERIMENTS_ERROR]);
    expect(_.map(actions, 'payload')).toMatchSnapshot();
  });
});

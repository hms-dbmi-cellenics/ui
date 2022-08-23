import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import {
  EXPERIMENTS_SAVING, EXPERIMENTS_ERROR, EXPERIMENTS_SAVED,
} from 'redux/actionTypes/experiments';
import { cloneExperiment } from 'redux/actions/experiments';
import initialExperimentState, { experimentTemplate } from 'redux/reducers/experiments/initialState';

const mockStore = configureStore([thunk]);

enableFetchMocks();

const experimentId = 'experiment-1';

const mockState = {
  experiments: {
    ...initialExperimentState,
    [experimentId]: {
      ...experimentTemplate,
    },
  },
};

describe('cloneExperiment', () => {
  beforeEach(() => {
    const response = new Response(JSON.stringify({}));

    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockResolvedValueOnce(response);

    jest.clearAllMocks();
    jest.useFakeTimers('modern').setSystemTime(new Date('2020-01-01').getTime());
  });

  it('Works correctly', async () => {
    const store = mockStore(mockState);
    await store.dispatch(cloneExperiment(experimentId, 'clonedExperiment'));

    const actions = store.getActions();

    expect(actions[0].type).toEqual(EXPERIMENTS_SAVING);
    expect(actions[1].type).toEqual(EXPERIMENTS_SAVED);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      `http://localhost:3000/v2/experiments/${experimentId}/clone`,
      expect.objectContaining({
        method: 'POST',
      }),
    );

    expect(fetchMock.mock.calls).toMatchSnapshot();
  });

  it('Throws an error if cloning experiment throws an error', async () => {
    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockRejectOnce(() => Promise.reject(new Error('Some error')));

    const store = mockStore(mockState);
    await store.dispatch(cloneExperiment(experimentId, 'clonedExperiment'));

    const actions = store.getActions();

    expect(actions[0].type).toEqual(EXPERIMENTS_SAVING);
    expect(actions[1].type).toEqual(EXPERIMENTS_ERROR);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      `http://localhost:3000/v2/experiments/${experimentId}/clone`,
      expect.objectContaining({
        method: 'POST',
      }),
    );

    expect(fetchMock.mock.calls[0][1].body).toMatchSnapshot();
  });
});

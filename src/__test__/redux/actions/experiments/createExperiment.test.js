import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import { EXPERIMENTS_SAVING, EXPERIMENTS_CREATED } from 'redux/actionTypes/experiments';
import { createExperiment } from 'redux/actions/experiments';
import initialExperimentState, { experimentTemplate } from 'redux/reducers/experiments/initialState';

const mockStore = configureStore([thunk]);

jest.mock('uuid', () => ({
  v4: () => ('f85035ac-de1e-4928-bed6-f55ef15b58f1'),
}));

enableFetchMocks();

describe('createExperiment', () => {
  const experimentId = 'experiment-1';

  const mockState = {
    experiments: {
      ...initialExperimentState,
      [experimentId]: {
        ...experimentTemplate,
      },
    },
  };

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
    await store.dispatch(createExperiment('name', 'description'));

    const actions = store.getActions();

    expect(actions[0].type).toEqual(EXPERIMENTS_SAVING);
    expect(actions[1].type).toEqual(EXPERIMENTS_CREATED);

    expect(actions[1].payload).toMatchSnapshot();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/v2/experiments/f85035ac-de1e-4928-bed6-f55ef15b58f1',
      expect.objectContaining({
        method: 'POST',
      }),
    );

    expect(fetchMock.mock.calls[0][1].body).toMatchSnapshot();
  });
});

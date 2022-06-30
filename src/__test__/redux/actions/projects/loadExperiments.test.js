import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import { experimentTemplate } from 'redux/reducers/experiments/initialState';
import { loadExperiments } from 'redux/actions/experiments';

import fake from '__test__/test-utils/constants';
import mockAPI, { generateDefaultMockAPIResponses } from '__test__/test-utils/mockAPI';
import { EXPERIMENTS_ERROR, EXPERIMENTS_LOADED } from 'redux/actionTypes/experiments';

enableFetchMocks();

const mockStore = configureStore([thunk]);

describe('load experiments ', () => {
  const initialState = {
    experiments: {
      ...experimentTemplate,
    },
  };

  beforeEach(() => {
    const mockAPIResponse = generateDefaultMockAPIResponses(fake.EXPERIMENT_ID);

    fetchMock.resetMocks();
    fetchMock.mockIf(/.*/, mockAPI(mockAPIResponse));

    jest.clearAllMocks();
  });

  it('Works correctly', async () => {
    const store = mockStore(initialState);

    await store.dispatch(loadExperiments());

    const actions = store.getActions();

    const lastAction = actions[actions.length - 1];
    expect(lastAction.type).toEqual(EXPERIMENTS_LOADED);
    expect(lastAction.payload).toMatchSnapshot();
  });

  it('Dispatches error correctly', async () => {
    fetchMock.mockReject(new Error('Something went wrong :/'));
    const store = mockStore(initialState);
    await store.dispatch(loadExperiments());
    const action = store.getActions()[0];
    expect(action.type).toEqual(EXPERIMENTS_ERROR);
  });
});

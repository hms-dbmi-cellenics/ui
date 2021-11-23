import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import initialExperimenttState, { experimentTemplate } from '../../../../redux/reducers/experiments/initialState';
import saveExperiment from '../../../../redux/actions/experiments/saveExperiment';
import {
  EXPERIMENTS_SAVING,
  EXPERIMENTS_SAVED,
  EXPERIMENTS_ERROR,
} from '../../../../redux/actionTypes/experiments';

import pushNotificationMessage from '../../../../utils/pushNotificationMessage';

import '__test__/test-utils/setupTests';

enableFetchMocks();
const mockStore = configureStore([thunk]);

describe('saveExperiment action', () => {
  const mockExperiment = {
    ...experimentTemplate,
    id: 'experiment-1',
    name: 'experiment-1',
    description: 'Project',
  };

  const initialState = {
    experiments: {
      ...initialExperimenttState,
      ids: [mockExperiment.id],
      [mockExperiment.id]: mockExperiment,
    },
  };

  const experimentInApiFormat = {
    description: 'Project',
    createdDate: null,
    lastViewed: null,
    notifyByEmail: true,
    meta: { organism: null, type: '10x' },
    sampleIds: [],
    experimentId: 'experiment-1',
    experimentName: 'experiment-1',
    projectId: null,
  };

  beforeEach(() => {
    const response = new Response(JSON.stringify({}));

    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockResolvedValueOnce(response);
  });

  it('Dispatches PUT fetch correctly by default.', async () => {
    const store = mockStore(initialState);
    await store.dispatch(saveExperiment(mockExperiment.id));

    expect(fetchMock).toHaveBeenCalledWith(
      `http://localhost:3000/v1/experiments/${mockExperiment.id}`,
      {
        body: JSON.stringify(experimentInApiFormat),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'PUT',
      },
    );
  });

  it('Dispatches POST fetch correctly when experiment doesnt already exist.', async () => {
    const store = mockStore(initialState);
    await store.dispatch(saveExperiment(mockExperiment.id, mockExperiment, false));

    expect(fetchMock).toHaveBeenCalledWith(
      `http://localhost:3000/v1/experiments/${mockExperiment.id}`,
      {
        body: JSON.stringify(experimentInApiFormat),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      },
    );
  });

  it('Dispatches correct actions when action is successful', async () => {
    const store = mockStore(initialState);

    await store.dispatch(saveExperiment(mockExperiment.id));

    const actions = store.getActions();

    // First action sets up saving status
    expect(actions[0].type).toBe(EXPERIMENTS_SAVING);

    // Second state saves error
    expect(actions[1].type).toBe(EXPERIMENTS_SAVED);

    expect(actions).toMatchSnapshot();
  });

  it('Dispatches a notification when fetch fails.', async () => {
    fetchMock.resetMocks();
    fetchMock.mockResponse(JSON.stringify({ message: 'Error from server hidden from user' }), { status: 500 });

    const store = mockStore(initialState);
    await store.dispatch(saveExperiment(mockExperiment.id));

    const actions = store.getActions();

    // First action sets up saving status
    expect(actions[0].type).toBe(EXPERIMENTS_SAVING);

    // Second state saves error
    expect(actions[1].type).toBe(EXPERIMENTS_ERROR);

    expect(pushNotificationMessage).toHaveBeenCalled();

    expect(actions).toMatchSnapshot();
  });
});

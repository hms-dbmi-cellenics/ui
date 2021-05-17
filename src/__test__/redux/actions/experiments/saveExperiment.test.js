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
import { NOTIFICATIONS_PUSH_MESSAGE } from '../../../../redux/actionTypes/notifications';

jest.mock('localforage');

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

  beforeEach(() => {
    const response = new Response(JSON.stringify({ one: 'one' }));

    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockResolvedValueOnce(response);
  });

  it('Dispatches fetch correctly.', async () => {
    const store = mockStore(initialState);
    await store.dispatch(saveExperiment(mockExperiment.id));

    expect(fetchMock).toHaveBeenCalledWith(
      `http://localhost:3000/v1/experiments/${mockExperiment.id}`,
      {
        body: JSON.stringify(mockExperiment),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'PUT',
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
    fetchMock.mockReject(new Error('some weird error that happened'));

    const store = mockStore(initialState);
    await store.dispatch(saveExperiment(mockExperiment.id));

    const actions = store.getActions();

    // First action sets up saving status
    expect(actions[0].type).toBe(EXPERIMENTS_SAVING);

    // Second state saves error
    expect(actions[1].type).toBe(EXPERIMENTS_ERROR);

    // Thirdd state emits notification
    expect(actions[2].type).toBe(NOTIFICATIONS_PUSH_MESSAGE);

    expect(actions).toMatchSnapshot();
  });
});

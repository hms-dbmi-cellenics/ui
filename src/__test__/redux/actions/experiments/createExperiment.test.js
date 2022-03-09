import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import { EXPERIMENTS_SAVING, EXPERIMENTS_CREATED, EXPERIMENTS_SAVED } from 'redux/actionTypes/experiments';
import { createExperiment } from 'redux/actions/experiments';
import initialExperimentState from 'redux/reducers/experiments/initialState';
import initialProjectState, { projectTemplate } from 'redux/reducers/projects/initialState';

import '__test__/test-utils/setupTests';

const mockStore = configureStore([thunk]);

enableFetchMocks();

describe('createExperiment', () => {
  const projectUuid = 'project-1';

  const mockState = {
    projects: {
      ...initialProjectState,
      [projectUuid]: {
        ...projectTemplate,
        uuid: projectUuid,
        experiments: [],
      },
    },
    experiments: {
      ...initialExperimentState,
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

  it('Dispatches action when called', async () => {
    const store = mockStore(mockState);
    await store.dispatch(createExperiment(projectUuid));

    const actions = store.getActions();

    expect(actions[0].type).toEqual(EXPERIMENTS_SAVING);
    expect(actions[1].type).toEqual(EXPERIMENTS_CREATED);
    expect(actions[2].type).toEqual(EXPERIMENTS_SAVED);

    expect(actions[1].payload).toMatchSnapshot();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/v1/experiments/b3f6c0ca86ec045c84f380cd5016972e',
      expect.objectContaining({
        method: 'POST',
      }),
    );

    expect(fetchMock.mock.calls[0][1].body).toMatchSnapshot();
  });
});

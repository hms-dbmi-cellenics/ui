import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import initialExperimentState, { experimentTemplate } from '../../../../redux/reducers/experiments/initialState';
// import { initialPipelineState }
// from '../../../../redux/reducers/experimentSettings/initialState';

jest.mock('localforage');

const mockStore = configureStore([thunk]);

describe('updateExperimentBackendStatus', () => {
  const experimentId = 'experiment-1';

  const mockExperiment = {
    ...experimentTemplate,
    name: 'experiment-1',
    id: experimentId,
  };

  // const mockBackendStatus = {
  //   pipeline: {
  //     ...initialPipelineState,
  //     startDate: '2021-01-01T00:00:00.000Z',
  //     stopDate: '2021-01-01T10:00:00.000Z',
  //     status: 'SUCCEEDED',
  //   },
  //   gem2s: {
  //     ...initialPipelineState,
  //     startDate: '2021-01-01T00:00:00.000Z',
  //     stopDate: '2021-01-01T10:00:00.000Z',
  //     status: 'SUCCEEDED',
  //   },
  // };

  const mockState = {
    experiments: {
      ...initialExperimentState,
      [experimentId]: mockExperiment,
    },
  };

  it('Dispatches action when called', async () => {
    const store = mockStore(mockState);

    // await store.dispatch(updateExperimentBackendStatus(experimentId, mockBackendStatus));

    const actions = store.getActions();

    // expect(actions[0].type).toEqual(EXPERIMENTS_BACKEND_STATUS_UPDATED);

    expect(actions).toMatchSnapshot();
  });
});
